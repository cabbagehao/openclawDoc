#!/usr/bin/env node

const DOMAIN = 'openclawdoc.org';
// IMPORTANT: Replace this with your actual IndexNow key or generate one.
// You must also ensure that `https://openclawdoc.org/<INDEXNOW_KEY>.txt` returns the key.
const INDEXNOW_KEY = 'aaee62069928a24e1781403d61296f62'; 
const INDEXNOW_KEY_FILENAME = `${INDEXNOW_KEY}.txt`;
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

// Only run in CI or when explicitly invoked, avoiding local dev runs if needed.
// Modify this check based on your CI provider (e.g., GITHUB_ACTIONS).
const isLocal = !process.env.CI && !process.env.GITHUB_ACTIONS;

if (isLocal) {
  console.log('🔍 Local run detected. Set CI=true or GITHUB_ACTIONS=true to skip this check if needed.');
  // Uncomment the next line if you want to prevent local submissions:
  // process.exit(0);
}

interface IndexNowSubmission {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

async function submitToIndexNow(urls: string[]): Promise<void> {
  if (!urls.length) {
    console.log('No URLs to submit to IndexNow');
    return;
  }

  // Batch submission, max 50 URLs per batch
  const batchSize = 50;
  const batches = [];

  for (let i = 0; i < urls.length; i += batchSize) {
    batches.push(urls.slice(i, i + batchSize));
  }

  console.log(`Submitting ${urls.length} URLs in ${batches.length} batches to IndexNow...`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`📦 Batch ${i + 1}/${batches.length}: ${batch.length} URLs`);

    const submission: IndexNowSubmission = {
      host: DOMAIN,
      key: INDEXNOW_KEY,
      keyLocation: `https://${DOMAIN}/${INDEXNOW_KEY}.svg`,
      urlList: batch
    };

    try {
      const response = await fetch(INDEXNOW_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OpenClaw-IndexNow-Bot/1.0'
        },
        body: JSON.stringify(submission)
      });

      if (response.ok) {
        console.log(`✅ Batch ${i + 1} submitted successfully (Status: ${response.status})`);
      } else {
        console.log(`❌ Batch ${i + 1} failed: ${response.status} ${response.statusText}`);
        if (response.status !== 403) {
          throw new Error(`IndexNow submission failed: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error submitting batch ${i + 1}:`, error);
      if (!(error instanceof Error) || !error.message.includes('403')) {
        throw error;
      }
    }

    if (i < batches.length - 1) {
      console.log('⏳ Waiting 2 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

async function fetchSitemapUrls(): Promise<string[]> {
  const sitemapUrl = `https://${DOMAIN}/sitemap.xml`;
  console.log(`📍 Fetching sitemap from: ${sitemapUrl}`);

  try {
    const response = await fetch(sitemapUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
    }

    const xml = await response.text();
    
    // Simple regex to extract <loc> URLs from sitemap
    const locRegex = /<loc>(.*?)<\/loc>/g;
    const urls = new Set<string>();
    let match;

    while ((match = locRegex.exec(xml)) !== null) {
      urls.add(match[1]);
    }

    const urlArray = Array.from(urls).sort();
    console.log(`Found ${urlArray.length} URLs in sitemap`);
    return urlArray;
  } catch (error) {
    console.error('❌ Error fetching/parsing sitemap:', error);
    return [];
  }
}

async function main() {
  console.log('🚀 Starting IndexNow submission for OpenClaw...');

  try {
    const urls = await fetchSitemapUrls();

    if (urls.length === 0) {
      console.log('⚠️ No URLs found to submit. Exiting.');
      return;
    }

    await submitToIndexNow(urls);
    console.log('✅ IndexNow submission completed');
  } catch (error) {
    console.error('❌ Error during IndexNow submission:', error);
  }
}

main();
