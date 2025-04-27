# StackRank

A command-line tool to rank ideas using an ELO rating system.

## Description

StackRank is a CLI tool that helps you rank a list of ideas using an ELO rating system, similar to what's used in chess rankings. Each idea has an ELO score that changes based on comparisons with other ideas. This approach provides a more nuanced ranking than simple ordering.

## Features

- **ELO Rating System**: Ideas are ranked using the ELO algorithm, providing a numerical score for each idea
- **Normalized Scores**: ELO scores are normalized to a 0-10 scale for easier interpretation
- **Comparison History**: Each comparison is recorded, allowing you to track how ideas perform over time
- **Smart Selection**: The system intelligently selects which ideas to compare next, prioritizing ideas with fewer comparisons
- **Interactive Menu**: Easy-to-use menu system for comparing ideas, viewing rankings, and adding new ideas

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd stackrank

# Install dependencies
npm install

# Build the project
npm run build

```

## Usage

```bash
# Run the tool
npm start
```

## How It Works

### ELO Rating System

The ELO rating system works by:

1. Assigning each new idea a default rating (1000) or the median of existing ratings
2. When two ideas are compared, their ratings are adjusted based on:
   - The expected outcome (based on current ratings)
   - The actual outcome (user's preference)
3. Ideas that "win" against higher-rated ideas gain more points
4. Ideas that "lose" against lower-rated ideas lose more points

### Normalized Scores

To make the ELO scores more intuitive:

- Raw ELO scores are normalized to a 0-10 scale
- The highest-ranked idea gets a score close to 10
- The lowest-ranked idea gets a score close to 0
- All other ideas are distributed proportionally in between
- This makes it easier to understand the relative strength of ideas at a glance

### Using the Tool

1. Select an option from the menu:
   - **Compare two ideas**: The system will present two ideas for comparison
   - **View rankings**: See all ideas sorted by their current ELO rating and normalized score
   - **Add new idea**: Add a new idea to the database
2. When comparing ideas, press `1` to select the first idea or `2` to select the second idea
3. Press `q` at any time to quit

## Data Storage

Ideas are stored in a JSON file with the following structure:

```json
{
  "ideas": [
    {
      "id": "a1b2c3d4",
      "text": "Your idea text here",
      "elo": 1050,
      "comparisons": [
        {
          "opponentId": "e5f6g7h8",
          "result": "win",
          "date": "2023-06-15T14:30:45.123Z",
          "eloChange": 15
        }
      ]
    }
  ],
  "lastUpdated": "2023-06-15T14:30:45.123Z"
}
```

## Development

```bash
# Build and run
npm run dev

# Clean build artifacts
npm run clean
```

## License

MIT