#!/usr/bin/env node
"use strict";

import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import { KeypressEvent, Idea, IdeasDatabase } from "./types";
import {
  readIdeasDatabase,
  saveIdeasDatabase,
  addIdea,
  updateElo,
  getRankings,
  selectIdeasForComparison,
  normalizeScores,
} from "./elo";

// Enable keypress event handling
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

// Helper function to capture a single keypress
function getSingleKey(): Promise<string> {
  return new Promise((resolve) => {
    const onKeypress = (str: string, key: KeypressEvent) => {
      if (key.name === "q" || key.name === "escape") {
        console.log("\nExiting...\n");
        process.exit(0);
      }
      process.stdin.removeListener("keypress", onKeypress);
      resolve(str);
    };
    process.stdin.on("keypress", onKeypress);
  });
}

// Function to compare two ideas using ELO
async function compareIdeas(
  a: Idea,
  b: Idea,
  database: IdeasDatabase,
  filePath: string
): Promise<void> {
  console.log(`\nWhich do you prefer?`);
  console.log(`(1) ${a.text}`);
  console.log(`(2) ${b.text}`);
  console.log(`Press '1' or '2' (or 'q' to quit)...`);

  while (true) {
    const key = await getSingleKey();
    if (key === "1") {
      const { winnerChange, loserChange } = updateElo(a, b);

      // Get normalized scores for these two ideas
      const normalized = normalizeScores([a, b]);
      const normalizedA =
        normalized.find((item) => item.idea.id === a.id)?.normalizedScore || 0;
      const normalizedB =
        normalized.find((item) => item.idea.id === b.id)?.normalizedScore || 0;

      console.log(`\nYou preferred: ${a.text}`);
      console.log(
        `${a.text} gained ${winnerChange} ELO points (now ${a.elo}, normalized: ${normalizedA}/10)`
      );
      console.log(
        `${b.text} lost ${Math.abs(loserChange)} ELO points (now ${
          b.elo
        }, normalized: ${normalizedB}/10)`
      );

      // Save after each comparison
      database.lastUpdated = new Date().toISOString();
      saveIdeasDatabase(database, filePath);
      return;
    }
    if (key === "2") {
      const { winnerChange, loserChange } = updateElo(b, a);

      // Get normalized scores for these two ideas
      const normalized = normalizeScores([a, b]);
      const normalizedA =
        normalized.find((item) => item.idea.id === a.id)?.normalizedScore || 0;
      const normalizedB =
        normalized.find((item) => item.idea.id === b.id)?.normalizedScore || 0;

      console.log(`\nYou preferred: ${b.text}`);
      console.log(
        `${b.text} gained ${winnerChange} ELO points (now ${b.elo}, normalized: ${normalizedB}/10)`
      );
      console.log(
        `${a.text} lost ${Math.abs(loserChange)} ELO points (now ${
          a.elo
        }, normalized: ${normalizedA}/10)`
      );

      // Save after each comparison
      database.lastUpdated = new Date().toISOString();
      saveIdeasDatabase(database, filePath);
      return;
    }
    console.log("Please press '1' or '2' (or 'q' to quit)...");
  }
}

// Function to add a new idea
async function promptForNewIdea(
  database: IdeasDatabase,
  filePath: string
): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("\nEnter a new idea (or press Enter to cancel): ", (text) => {
      rl.close();

      if (text.trim() === "") {
        console.log("Cancelled adding new idea.");
        resolve();
        return;
      }

      const idea = addIdea(database, text);
      console.log(
        `Added new idea: "${text}" with ID ${idea.id} and initial ELO ${idea.elo}`
      );

      // Save after adding
      database.lastUpdated = new Date().toISOString();
      saveIdeasDatabase(database, filePath);
      resolve();
    });
  });
}

// Function to display the menu
async function displayMenu(): Promise<string> {
  console.log("\n=== ELO Idea Ranking System ===");
  console.log("1. Compare two ideas");
  console.log("2. View rankings");
  console.log("3. Add new idea");
  console.log("q. Quit");
  console.log("\nSelect an option (1-3 or q):");

  while (true) {
    const key = await getSingleKey();
    if (["1", "2", "3", "q"].includes(key)) {
      return key;
    }
    console.log("Please select a valid option (1-3 or q):");
  }
}

// Function to display rankings
function displayRankings(database: IdeasDatabase): void {
  const rankings = getRankings(database);

  console.log("\n=== Current Idea Rankings ===");
  if (rankings.length === 0) {
    console.log("No ideas in the database yet.");
    return;
  }

  // Get normalized scores (0-10 scale)
  const normalizedRankings = normalizeScores(rankings);

  console.log("Rank | ELO  | Score (0-10) | Comparisons | Idea");
  console.log("-----|------|--------------|-------------|------------------");

  normalizedRankings.forEach(({ idea, normalizedScore }, index) => {
    console.log(
      `${(index + 1).toString().padEnd(4)} | ${idea.elo
        .toString()
        .padEnd(4)} | ${normalizedScore
        .toString()
        .padEnd(12)} | ${idea.comparisons.length.toString().padEnd(11)} | ${
        idea.text
      }`
    );
  });
}

// **Main function**
(async () => {
  // Default file path
  const defaultFilePath = path.join(__dirname, "../ideas.json");

  // Use command line argument for file path if provided, otherwise use default
  const filePath = process.argv[2] || defaultFilePath;

  console.log(`Reading ideas database from: ${filePath}`);
  let database = readIdeasDatabase(filePath);

  console.log(
    "\nWelcome to the ELO Idea Ranking System!\n(Press 'q' anytime to quit)"
  );

  while (true) {
    const choice = await displayMenu();

    switch (choice) {
      case "1": // Compare ideas
        if (database.ideas.length < 2) {
          console.log(
            "\nYou need at least 2 ideas to make a comparison. Please add more ideas."
          );
          break;
        }

        try {
          const [ideaA, ideaB] = selectIdeasForComparison(database);
          await compareIdeas(ideaA, ideaB, database, filePath);
        } catch (error: any) {
          console.error(`Error during comparison: ${error.message}`);
        }
        break;

      case "2": // View rankings
        displayRankings(database);
        break;

      case "3": // Add new idea
        await promptForNewIdea(database, filePath);
        break;

      case "q": // Quit
        console.log("\nExiting...\n");
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(false);
        }
        process.exit(0);
    }
  }
})();
