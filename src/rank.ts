#!/usr/bin/env node
"use strict";

import * as readline from "readline";
import { KeypressEvent } from "./types";

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
  let myIdeas: string[] = [
    "Scraping tool with AI to rebuild website UIs for demo environments",
    "Developer platform alternative to GitHub with an AI plugin ecosystem",
    "AI-powered plugin for open source documentation platforms",
    "Pricing and margins automation and observability tool",
    "Plug-and-play SaaS alerting and log delivery system with webhook integration",
    "Aggregated, anonymous software review platform replacing G2/Siftery",
    "Doctor virtual assistant for answering patient questions",
    "Insurance claims platform for at-home caregivers",
    "Nursing home management software",
    "AI agent platform that connects and monetizes small AI agents",
    "Travel itinerary planning and sharing tool (with spreadsheet-like interface)",
    "Travel maps with social recommendations",
    "Booking software platform for service businesses (like a Shopify for bookings)",
    "Tool for building Duolingo-style learning apps with GPT integration",
    "Peer mentoring platform for professionals (including teacher-for-teacher models)",
    "Product wishlist sharing platform",
    "Price tracking tool for product pages with URL input and offer code integration",
    "SEO tool for AI chatbots",
    "Distributed proxy network with crypto payouts",
    "Contract analysis tool to extract agreements and SLAs",
  ];

  console.log(
    "\nWelcome! Let's rank your ideas...\n(Press 'q' anytime to quit)"
  );

  myIdeas = await mergeSort(myIdeas);

  console.log("\nYour final stack ranking:");
  myIdeas.forEach((idea, i) => {
    console.log(`${i + 1}. ${idea}`);
  });

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.exit(0);
})();
