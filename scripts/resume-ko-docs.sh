#!/bin/bash

# OpenClaw Korean Translation Resumer
# This script identifies the next document to be translated based on KO_TRANSLATION_TODO.md

TODO_FILE="KO_TRANSLATION_TODO.md"

if [ ! -f "$TODO_FILE" ]; then
    echo "Error: $TODO_FILE not found."
    exit 1
fi

# Find the first unchecked item
NEXT_ITEM=$(grep -m 1 "\- \[ \]" "$TODO_FILE")

if [ -z "$NEXT_ITEM" ]; then
    echo "All documents are optimized! 🎉"
    exit 0
fi

# Extract source and target paths
# Format is: - [ ] `docs/source.md` -> `docs/ko-KR/target.md`
SOURCE_PATH=$(echo "$NEXT_ITEM" | sed -E 's/.*`([^`]+)` -> `([^`]+)`.*/\1/')
TARGET_PATH=$(echo "$NEXT_ITEM" | sed -E 's/.*`([^`]+)` -> `([^`]+)`.*/\2/')

echo "--------------------------------------------------"
echo "🚀 Next Translation Task identified:"
echo "Source: $SOURCE_PATH"
echo "Target: $TARGET_PATH"
echo "--------------------------------------------------"
echo ""
echo "Resume Prompt Snippet:"
echo "--------------------------------------------------"
echo "The translation task was interrupted. Based on KO_TRANSLATION_TODO.md,"
echo "the next file to optimize is: $SOURCE_PATH -> $TARGET_PATH"
echo "Please read these files and provide an optimized Korean version."
echo "--------------------------------------------------"
