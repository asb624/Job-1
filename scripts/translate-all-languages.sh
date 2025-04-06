#!/bin/bash

# This script processes each language one by one with adequate delays
# to respect API rate limits and avoid timeouts

LANGUAGES=("bn" "gu" "pa" "ml" "te" "kn" "mr" "or" "as" "kok" "ks" "sd" "mni" "brx")

# Process each language with a delay between them
for lang in "${LANGUAGES[@]}"; do
  echo "============================================="
  echo "Processing language: $lang"
  echo "============================================="
  
  # Run the translation script for this language
  node scripts/translate-language.js "$lang"
  
  # Wait between languages to avoid API rate limits
  echo "Waiting 30 seconds before processing next language..."
  sleep 30
done

echo "All languages processed!"