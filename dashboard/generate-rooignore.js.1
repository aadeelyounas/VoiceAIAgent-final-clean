/**
 * Smart Roo-Ignore Generator
 *
 * A script to generate .rooignore files that focus only on large files that would 
 * exceed the LLM's context window, avoiding overly aggressive pattern matching.
 *
 * Usage:
 *   node smart-rooignore.js [directory] [--threshold=45000]
 *
 * Options:
 *   --threshold=NUMBER   Set custom token threshold (default: 45000)
 *   --help               Show help information
 */

const fs = require('fs');
const path = require('path');

/**
 * Estimates the number of tokens in a file using a simple approximation.
 * Uses the rough heuristic of ~4 characters ≈ 1 token
 */
function estimateTokens(filePath) {
  try {
    // For binary files, estimate based on file size
    const ext = path.extname(filePath).toLowerCase();
    const commonBinaryExts = ['.exe', '.dll', '.so', '.dylib', '.zip', '.tar', '.gz', 
                         '.mp4', '.mp3', '.wav', '.jpg', '.png', '.gif', '.pdf'];
    
    const stats = fs.statSync(filePath);
    
    // If it's a small file, read and analyze it
    // For larger files, especially binary ones, use the file size as a proxy
    if (stats.size < 500000 && !commonBinaryExts.includes(ext)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        // Simple approximation: ~4 characters ≈ 1 token
        return Math.ceil(content.length / 4);
      } catch (readError) {
        // If we can't read it as text, fall back to file size
        return Math.ceil(stats.size / 4);
      }
    } else {
      // For binary files or large files, use file size
      return Math.ceil(stats.size / 4);
    }
  } catch (error) {
    console.error(`Error accessing file ${filePath}: ${error.message}`);
    return 0;
  }
}

/**
 * Reads an existing .rooignore file and parses its structure
 */
function parseExistingRooignore(rooignorePath) {
  try {
    if (!fs.existsSync(rooignorePath)) {
      return {
        exists: false,
        content: '',
        patterns: [],
        hasLargeFilesSection: false
      };
    }
    
    const content = fs.readFileSync(rooignorePath, 'utf8');
    const lines = content.split('\n');
    
    // Extract non-comment patterns for duplicate checking
    const patterns = lines
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#'));
      
    // Check if it has a large files section
    const hasLargeFilesSection = content.includes('# Files over') &&
                                content.includes('tokens (LLM context overflow prevention)');
    
    return {
      exists: true,
      content,
      patterns,
      hasLargeFilesSection
    };
  } catch (error) {
    console.error(`Error reading .rooignore: ${error.message}`);
    return {
      exists: false,
      content: '',
      patterns: [],
      hasLargeFilesSection: false
    };
  }
}

/**
 * Extracts patterns from a .gitignore file.
 */
function extractGitignorePatterns(gitignorePath) {
  try {
    if (!fs.existsSync(gitignorePath)) {
      return [];
    }
    
    const content = fs.readFileSync(gitignorePath, 'utf8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#'));
  } catch (error) {
    console.error(`Error reading .gitignore: ${error.message}`);
    return [];
  }
}

/**
 * Get directories to skip during scanning for efficiency.
 * This ONLY affects scanning, not what ends up in the .rooignore file.
 */
function getDirectoriesToSkipWhenScanning(gitignorePatterns = []) {
  // Base set of directories that are almost always too large/not useful
  const skipDirs = [
    // Version control
    '.git', '.svn', '.hg',
    
    // Dependency directories (these have far too many files)
    'node_modules', 'bower_components',
    
    // Build outputs
    'dist', 'build', 
    
    // Cache directories
    '.cache', 
    
    // Python-specific
    '__pycache__', '.pytest_cache',
  ];
  
  // Extract directory patterns from gitignore to potentially skip
  const gitignoreDirs = gitignorePatterns
    .filter(pattern => pattern.endsWith('/'))
    .map(pattern => pattern.slice(0, -1));
  
  // Only add specific directories from gitignore that are definitely bulk directories
  // We don't want to skip important project directories
  const bulkDirectoryKeywords = [
    'venv', 'env', 'node_modules', 'vendor', 'target', 'output', 'build', 'dist',
    'coverage', 'temp', 'tmp', 'cache', 'logs'
  ];
  
  const additionalSkipDirs = gitignoreDirs.filter(dir => 
    bulkDirectoryKeywords.some(keyword => dir.toLowerCase().includes(keyword))
  );
  
  return [...new Set([...skipDirs, ...additionalSkipDirs])];
}

/**
 * Recursively walks a directory and returns a list of file paths.
 * Skips directories that should be ignored for efficiency.
 */
function walkDirectory(dir, fileList = [], skipDirs = []) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      try {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // Skip common large directories for efficiency
          if (!skipDirs.includes(file)) {
            walkDirectory(filePath, fileList, skipDirs);
          } else {
            console.log(`Skipping directory: ${filePath} (for scan efficiency)`);
          }
        } else {
          fileList.push(filePath);
        }
      } catch (error) {
        console.error(`Error processing ${path.join(dir, file)}: ${error.message}`);
      }
    });
    
    return fileList;
  } catch (error) {
    console.error(`Error reading directory ${dir}: ${error.message}`);
    return fileList;
  }
}

/**
 * Generates a .rooignore file for a directory.
 */
function generateRooignore(directory, tokenThreshold) {
  try {
    // Only minimal, truly essential patterns for binary files
    const minimalBinaryPatterns = [
      '*.zip', '*.gz', '*.tar', '*.rar', '*.7z',           // Archives
      '*.jpg', '*.jpeg', '*.png', '*.gif', '*.bmp', '*.ico', // Images
      '*.mp4', '*.mov', '*.avi', '*.mpg', '*.mpeg',        // Videos
      '*.mp3', '*.wav', '*.ogg', '*.flac', '*.aac',         // Audio
      '*.bin', '*.exe', '*.dll', '*.so', '*.dylib',        // Binaries
      '*.pdf', '*.psd', '*.ai'                             // Documents
    ];
    
    // Read .gitignore if it exists (for scanning efficiency only)
    const gitignorePath = path.join(directory, '.gitignore');
    const gitignorePatterns = extractGitignorePatterns(gitignorePath);
    
    // Get directories to skip when scanning (for efficiency only)
    const skipDirs = getDirectoriesToSkipWhenScanning(gitignorePatterns);
    console.log(`Skipping ${skipDirs.length} directories to improve scan performance`);
    
    // Parse existing .rooignore if it exists
    const rooignorePath = path.join(directory, '.rooignore');
    const existingRooignore = parseExistingRooignore(rooignorePath);
    
    if (existingRooignore.exists) {
      console.log(`Found existing .rooignore with ${existingRooignore.patterns.length} patterns`);
    }
    
    // Find large files
    console.log(`Scanning for files exceeding ${tokenThreshold} tokens...`);
    const files = walkDirectory(directory, [], skipDirs);
    console.log(`Found ${files.length} files to analyze`);
    
    const largeFiles = [];
    let processedCount = 0;
    
    for (const file of files) {
      processedCount++;
      if (processedCount % 100 === 0 || processedCount === files.length) {
        process.stdout.write(`\rAnalyzing files: ${processedCount}/${files.length} (${Math.floor(processedCount/files.length*100)}%)`);
      }
      
      // Get relative path
      const relativePath = path.relative(directory, file).replace(/\\/g, '/');
      
      // Check token size
      const tokens = estimateTokens(file);
      if (tokens > tokenThreshold) {
        largeFiles.push(relativePath);
        process.stdout.write('\n');
        console.log(`Large file found: ${relativePath} (approximately ${tokens} tokens)`);
      }
    }
    
    process.stdout.write('\n');
    
    // Filter out large files that are already in existing patterns
    const newLargeFiles = largeFiles.filter(file => !existingRooignore.patterns.includes(file));
    
    if (newLargeFiles.length > 0) {
      console.log(`Found ${newLargeFiles.length} new large files to be added to .rooignore`);
    } else if (largeFiles.length > 0) {
      console.log(`All ${largeFiles.length} large files are already in .rooignore`);
    }
    
    // Generate content based on whether file exists and has large files section
    let rooignoreContent;
    
    if (!existingRooignore.exists) {
      // No existing file - create a new one from scratch
      rooignoreContent = [
        '# Auto-generated .rooignore file',
        '# Files and directories to be ignored by Roo-Code\'s LLM processing',
        '# Generated on: ' + new Date().toISOString(),
        '',
        `# Files over ${tokenThreshold} tokens (LLM context overflow prevention)`,
        ...largeFiles,
        '',
        '# Common binary file patterns',
        ...minimalBinaryPatterns,
        '',
        '# Project-specific patterns'
      ].join('\n');
    } else if (existingRooignore.hasLargeFilesSection) {
      // Existing file with a large files section - update just that section
      const lines = existingRooignore.content.split('\n');
      let inLargeFilesSection = false;
      let updatedLines = [];
      let insertedLargeFiles = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if we're entering the large files section
        if (line.includes('# Files over') && line.includes('tokens (LLM context overflow prevention)')) {
          // Add the updated large files section header
          updatedLines.push(`# Files over ${tokenThreshold} tokens (LLM context overflow prevention)`);
          inLargeFilesSection = true;
          
          // Add all large files (new and existing)
          for (const file of largeFiles) {
            updatedLines.push(file);
          }
          
          // Skip forward until we're out of the large files section
          let j = i + 1;
          while (j < lines.length) {
            if (lines[j].startsWith('#') || lines[j].trim() === '') {
              break;
            }
            j++;
          }
          
          // If we found an empty line, add it as a separator
          if (j < lines.length && lines[j].trim() === '') {
            updatedLines.push('');
          }
          
          // Move the loop index forward
          i = j - 1;
          insertedLargeFiles = true;
          continue;
        }
        
        // Add non-large-files-section lines as-is
        updatedLines.push(line);
      }
      
      // If we didn't find a large files section, add it at the top
      if (!insertedLargeFiles) {
        // Find the insert position (after the header comments)
        let insertPos = 0;
        while (insertPos < updatedLines.length && updatedLines[insertPos].startsWith('#')) {
          insertPos++;
        }
        
        // If there were header comments, leave a blank line
        if (insertPos > 0) {
          if (insertPos < updatedLines.length && updatedLines[insertPos].trim() !== '') {
            updatedLines.splice(insertPos, 0, '');
            insertPos++;
          }
        }
        
        // Insert the large files section
        updatedLines.splice(insertPos, 0,
          `# Files over ${tokenThreshold} tokens (LLM context overflow prevention)`,
          ...largeFiles,
          '' // Blank line after the section
        );
      }
      
      rooignoreContent = updatedLines.join('\n');
    } else {
      // Existing file without a large files section - add the section
      const lines = existingRooignore.content.split('\n');
      
      // Find where to insert (after header comments)
      let insertPos = 0;
      while (insertPos < lines.length && lines[insertPos].startsWith('#')) {
        insertPos++;
      }
      
      // Ensure there's a blank line before we insert
      if (insertPos > 0 && insertPos < lines.length && lines[insertPos].trim() !== '') {
        lines.splice(insertPos, 0, '');
        insertPos++;
      }
      
      // Insert large files section
      lines.splice(insertPos, 0,
        `# Files over ${tokenThreshold} tokens (LLM context overflow prevention)`,
        ...largeFiles,
        '' // Blank line after section
      );
      
      rooignoreContent = lines.join('\n');
    }
    
    // Write to .rooignore file
    fs.writeFileSync(rooignorePath, rooignoreContent);
    
    console.log(`\nCreated/updated .rooignore file at ${rooignorePath}`);
    console.log(`Detected ${largeFiles.length} large files (${newLargeFiles.length} newly added)`);
    
  } catch (error) {
    console.error(`Error generating .rooignore: ${error.message}`);
  }
}

/**
 * Displays help information
 */
function showHelp() {
  console.log(`
Smart Roo-Ignore Generator - Create a .rooignore file to prevent LLM context overflow

Usage:
  node smart-rooignore.js [directory] [--threshold=45000]

Options:
  --threshold=NUMBER   Set custom token threshold (default: 45000)
  --help               Show this help information

Examples:
  node smart-rooignore.js                     # Use current directory with default threshold
  node smart-rooignore.js --threshold=30000   # Use current directory with 30k token threshold
  node smart-rooignore.js ./my-project        # Analyze a specific directory
`);
}

// Main function
function main() {
  try {
    const args = process.argv.slice(2);
    let directories = [];
    let tokenThreshold = 45000; // Default threshold
    
    // Parse arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--help') {
        showHelp();
        return;
      } else if (arg.startsWith('--threshold=')) {
        const thresholdStr = arg.split('=')[1];
        const threshold = parseInt(thresholdStr, 10);
        
        if (isNaN(threshold) || threshold <= 0) {
          console.error('Invalid threshold value. Must be a positive number.');
          return;
        }
        
        tokenThreshold = threshold;
      } else if (!arg.startsWith('--')) {
        // Assume it's a directory path
        directories.push(arg);
      }
    }
    
    if (directories.length === 0) {
      // Use current directory
      directories = [process.cwd()];
      console.log('No directory specified, using current directory.');
    }
    
    console.log(`Using token threshold: ${tokenThreshold}`);
    
    directories.forEach(directory => {
      console.log(`\n=== Generating .rooignore for ${directory} ===\n`);
      generateRooignore(directory, tokenThreshold);
    });
    
  } catch (error) {
    console.error(`Error in main function: ${error.message}`);
  }
}

// Run the main function
main();