#!/usr/bin/env node
"use strict";

import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import { KeypressEvent } from "./types";

// Enable keypress event handling
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

// Function to read ideas from a JSON file
function readIdeasFromFile(filePath: string): string[] {
  try {
    const absolutePath = path.resolve(filePath);
    const fileContent = fs.readFileSync(absolutePath, "utf8");
    const data = JSON.parse(fileContent);

    if (!Array.isArray(data.ideas)) {
      throw new Error("JSON file must contain an 'ideas' array");
    }

    return data.ideas;
  } catch (error) {
    console.error(`Error reading ideas file: ${error.message}`);
    process.exit(1);
  }
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

// Function to compare two ideas
async function getPreference(a: string, b: string): Promise<string> {
  console.log(`\nWhich do you prefer?`);
  console.log(`(1) ${a}`);
  console.log(`(2) ${b}`);
  console.log(`Press '1' or '2' (or 'q' to quit)...`);

  while (true) {
    const key = await getSingleKey();
    if (key === "1") return a;
    if (key === "2") return b;
    console.log("Please press '1' or '2' (or 'q' to quit)...");
  }
}

// **Merge Sort with User Input**
async function mergeSort(ideas: string[]): Promise<string[]> {
  if (ideas.length <= 1) return ideas; // Base case

  const mid = Math.floor(ideas.length / 2);
  const left = await mergeSort(ideas.slice(0, mid));
  const right = await mergeSort(ideas.slice(mid));

  return await merge(left, right);
}

// **Merge function that sorts using user preferences**
async function merge(left: string[], right: string[]): Promise<string[]> {
  const sorted: string[] = [];
  while (left.length && right.length) {
    const preferred = await getPreference(left[0], right[0]);
    if (preferred === left[0]) {
      const item = left.shift();
      if (item !== undefined) {
        sorted.push(item);
      }
    } else {
      const item = right.shift();
      if (item !== undefined) {
        sorted.push(item);
      }
    }
  }
  return [...sorted, ...left, ...right]; // Append remaining elements
}

// **Main function**
(async () => {
  // Default file path
  const defaultFilePath = path.join(__dirname, "../ideas.json");

  // Use command line argument for file path if provided, otherwise use default
  const filePath = process.argv[2] || defaultFilePath;

  console.log(`Reading ideas from: ${filePath}`);
  const myIdeas = readIdeasFromFile(filePath);

  console.log(
    "\nWelcome! Let's rank your ideas...\n(Press 'q' anytime to quit)"
  );

  const rankedIdeas = await mergeSort(myIdeas);

  console.log("\nYour final stack ranking:");
  rankedIdeas.forEach((idea, i) => {
    console.log(`${i + 1}. ${idea}`);
  });

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.exit(0);
})();
