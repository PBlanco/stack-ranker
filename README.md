# StackRank

A command-line tool to stack rank ideas using merge sort and user preferences.

## Description

StackRank is a simple CLI tool that helps you rank a list of ideas by comparing them two at a time. It uses a merge sort algorithm where the comparison is done by the user, allowing you to build a complete ranking of your ideas based on your preferences.

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd stackrank

# Install dependencies
npm install

# Build the project
npm run build

# Link the package globally (optional)
npm link
```

## Usage

```bash
# Run directly
npm start

# Or if linked globally
stackrank
```

## How It Works

1. The tool presents you with two ideas and asks which one you prefer.
2. Press `1` to select the first idea or `2` to select the second idea.
3. Press `q` at any time to quit.
4. After all comparisons are made, the tool displays your final stack ranking.

## Development

```bash
# Build and run
npm run dev

# Clean build artifacts
npm run clean
```

## License

ISC 