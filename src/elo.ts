#!/usr/bin/env node
"use strict";

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { Idea, Comparison, IdeasDatabase } from "./types";

// Default ELO constants
const DEFAULT_ELO = 1000;
const K_FACTOR = 32; // How much the ELO changes after each comparison

/**
 * Generates a unique ID for a new idea
 */
function generateId(text: string): string {
  return crypto.createHash("md5").update(text).digest("hex").substring(0, 8);
}

/**
 * Reads the ideas database from a JSON file
 */
export function readIdeasDatabase(filePath: string): IdeasDatabase {
  try {
    const absolutePath = path.resolve(filePath);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      // Return empty database if file doesn't exist
      return {
        ideas: [],
        lastUpdated: new Date().toISOString(),
      };
    }

    const fileContent = fs.readFileSync(absolutePath, "utf8");
    const data = JSON.parse(fileContent);

    // Handle migration from old format (array of strings) to new format (IdeasDatabase)
    if (Array.isArray(data.ideas) && typeof data.ideas[0] === "string") {
      console.log("Migrating from old format to ELO ranking system...");
      return migrateFromOldFormat(data.ideas);
    }

    return data as IdeasDatabase;
  } catch (error: any) {
    console.error(`Error reading ideas database: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Migrates from the old format (array of strings) to the new ELO format
 */
function migrateFromOldFormat(oldIdeas: string[]): IdeasDatabase {
  const ideas: Idea[] = oldIdeas.map((text) => ({
    id: generateId(text),
    text,
    elo: DEFAULT_ELO,
    comparisons: [],
  }));

  return {
    ideas,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Saves the ideas database to a JSON file
 */
export function saveIdeasDatabase(
  database: IdeasDatabase,
  filePath: string
): void {
  try {
    const absolutePath = path.resolve(filePath);
    const jsonData = JSON.stringify(database, null, 2);
    fs.writeFileSync(absolutePath, jsonData, "utf8");
    console.log(`Database saved to ${absolutePath}`);
  } catch (error: any) {
    console.error(`Error saving ideas database: ${error.message}`);
  }
}

/**
 * Adds a new idea to the database
 */
export function addIdea(database: IdeasDatabase, text: string): Idea {
  // Check if idea already exists
  const existingIdea = database.ideas.find((idea) => idea.text === text);
  if (existingIdea) {
    console.log(`Idea already exists with ID: ${existingIdea.id}`);
    return existingIdea;
  }

  // Determine initial ELO score
  let initialElo = DEFAULT_ELO;

  // If there are existing ideas, use median ELO to avoid early bias
  if (database.ideas.length > 0) {
    const sortedElos = [...database.ideas]
      .map((idea) => idea.elo)
      .sort((a, b) => a - b);
    const midIndex = Math.floor(sortedElos.length / 2);
    initialElo =
      sortedElos.length % 2 === 0
        ? (sortedElos[midIndex - 1] + sortedElos[midIndex]) / 2
        : sortedElos[midIndex];
  }

  const newIdea: Idea = {
    id: generateId(text),
    text,
    elo: initialElo,
    comparisons: [],
  };

  database.ideas.push(newIdea);
  database.lastUpdated = new Date().toISOString();

  return newIdea;
}

/**
 * Calculates the expected score for a player based on ELO ratings
 */
function calculateExpectedScore(
  playerRating: number,
  opponentRating: number
): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

/**
 * Updates ELO ratings after a comparison
 */
export function updateElo(
  winner: Idea,
  loser: Idea
): { winnerChange: number; loserChange: number } {
  const expectedWinnerScore = calculateExpectedScore(winner.elo, loser.elo);
  const expectedLoserScore = calculateExpectedScore(loser.elo, winner.elo);

  // Calculate ELO changes
  const winnerChange = Math.round(K_FACTOR * (1 - expectedWinnerScore));
  const loserChange = Math.round(K_FACTOR * (0 - expectedLoserScore));

  // Update ELO scores
  winner.elo += winnerChange;
  loser.elo += loserChange;

  // Record the comparison
  const now = new Date().toISOString();

  winner.comparisons.push({
    opponentId: loser.id,
    result: "win",
    date: now,
    eloChange: winnerChange,
  });

  loser.comparisons.push({
    opponentId: winner.id,
    result: "loss",
    date: now,
    eloChange: loserChange,
  });

  return { winnerChange, loserChange };
}

/**
 * Gets the current rankings of all ideas
 */
export function getRankings(database: IdeasDatabase): Idea[] {
  return [...database.ideas].sort((a, b) => b.elo - a.elo);
}

/**
 * Normalizes ELO scores to a 0-10 scale
 * @param ideas The list of ideas to normalize
 * @param minScore The minimum score on the normalized scale (default: 0)
 * @param maxScore The maximum score on the normalized scale (default: 10)
 * @returns An array of objects with the original idea and its normalized score
 */
export function normalizeScores(
  ideas: Idea[],
  minScore: number = 0,
  maxScore: number = 10
): Array<{ idea: Idea; normalizedScore: number }> {
  if (ideas.length === 0) return [];

  // Find the min and max ELO scores
  const eloScores = ideas.map((idea) => idea.elo);
  const minElo = Math.min(...eloScores);
  const maxElo = Math.max(...eloScores);

  // If all ideas have the same score, return the middle of the range
  if (minElo === maxElo) {
    return ideas.map((idea) => ({
      idea,
      normalizedScore: (minScore + maxScore) / 2,
    }));
  }

  // Normalize each score to the desired range
  return ideas.map((idea) => {
    // Linear normalization formula: newValue = minScore + (value - minValue) * (maxScore - minScore) / (maxValue - minValue)
    const normalizedScore =
      minScore +
      ((idea.elo - minElo) * (maxScore - minScore)) / (maxElo - minElo);

    // Round to 1 decimal place for readability
    return {
      idea,
      normalizedScore: Math.round(normalizedScore * 10) / 10,
    };
  });
}

/**
 * Selects two ideas for comparison
 * Uses a weighted random selection to favor ideas with fewer comparisons
 */
export function selectIdeasForComparison(
  database: IdeasDatabase
): [Idea, Idea] {
  if (database.ideas.length < 2) {
    throw new Error("Need at least 2 ideas for comparison");
  }

  // Sort ideas by number of comparisons (ascending)
  const sortedIdeas = [...database.ideas].sort(
    (a, b) => a.comparisons.length - b.comparisons.length
  );

  // Select first idea (bias towards less compared ideas)
  const firstIndex = Math.floor(
    Math.random() * Math.min(3, sortedIdeas.length)
  );
  const firstIdea = sortedIdeas[firstIndex];

  // Remove the selected idea from the array
  sortedIdeas.splice(firstIndex, 1);

  // For the second idea, prefer ideas that haven't been compared with the first idea
  const notComparedYet = sortedIdeas.filter(
    (idea) => !firstIdea.comparisons.some((comp) => comp.opponentId === idea.id)
  );

  let secondIdea;
  if (notComparedYet.length > 0) {
    // Randomly select from ideas not yet compared
    secondIdea =
      notComparedYet[Math.floor(Math.random() * notComparedYet.length)];
  } else {
    // If all ideas have been compared, just pick randomly from remaining ideas
    secondIdea = sortedIdeas[Math.floor(Math.random() * sortedIdeas.length)];
  }

  return [firstIdea, secondIdea];
}
