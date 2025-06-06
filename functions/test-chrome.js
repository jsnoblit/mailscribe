const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testChromeDetection() {
  console.log('🔍 Testing Chrome path detection...');
  
  // Your specific Chrome path
  const yourChromePath = "/Users/jnoblit/.cache/puppeteer/chrome/mac_arm-137.0.7151.55/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
  
  console.log('📍 Your Chrome path:', yourChromePath);
  console.log('✅ Path exists:', fs.existsSync(yourChromePath));
  
  // Test the glob pattern detection
  const possibleChromePaths = [
    "/Users/jnoblit/.cache/puppeteer/chrome/mac_arm-137.0.7151.55/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.HOME + "/.cache/puppeteer/chrome/mac_arm-*/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
  ].filter(Boolean);

  let detectedPath;
  for (const chromePath of possibleChromePaths) {
    if (chromePath && chromePath.includes('*')) {
      const baseDir = chromePath.split('*')[0];
      const suffix = chromePath.split('*')[1] || '';
      console.log('🔍 Checking glob pattern:', chromePath);
      console.log('   Base dir:', baseDir);
      console.log('   Suffix:', suffix);
      
      try {
        if (fs.existsSync(baseDir)) {
          console.log('   ✅ Base dir exists');
          const dirs = fs.readdirSync(baseDir);
          console.log('   📁 Found dirs:', dirs);
          
          for (const dir of dirs) {
            const fullPath = path.join(baseDir, dir, suffix);
            console.log('   🔍 Trying:', fullPath);
            if (fs.existsSync(fullPath)) {
              detectedPath = fullPath;
              console.log('   ✅ Found Chrome at:', fullPath);
              break;
            }
          }
        }
      } catch (e) {
        console.log('   ❌ Error:', e.message);
      }
    } else if (chromePath && fs.existsSync(chromePath)) {
      detectedPath = chromePath;
      console.log('✅ Direct path found:', chromePath);
      break;
    }
  }

  if (detectedPath) {
    console.log('🎉 Chrome detected at:', detectedPath);
    
    try {
      console.log('🚀 Testing Puppeteer launch...');
      const browser = await puppeteer.launch({
        headless: true,
        executablePath: detectedPath,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent('<html><body><h1>Test Page</h1></body></html>');
      
      console.log('📸 Taking test screenshot...');
      const screenshot = await page.screenshot({ 
        type: 'png',
        encoding: 'base64'
      });
      
      await browser.close();
      
      console.log('✅ Screenshot successful! Length:', screenshot.length);
      console.log('🎉 Puppeteer is working correctly!');
      
    } catch (error) {
      console.log('❌ Puppeteer test failed:', error.message);
    }
  } else {
    console.log('❌ No Chrome executable found');
  }
}

// Test without specifying executablePath (let Puppeteer find it)
async function testDefaultPuppeteer() {
  console.log('\n🔍 Testing default Puppeteer (no executablePath)...');
  
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent('<html><body><h1>Default Test</h1></body></html>');
    
    const screenshot = await page.screenshot({ 
      type: 'png',
      encoding: 'base64'
    });
    
    await browser.close();
    
    console.log('✅ Default Puppeteer works! Screenshot length:', screenshot.length);
    
  } catch (error) {
    console.log('❌ Default Puppeteer failed:', error.message);
  }
}

// Run tests
testChromeDetection().then(() => {
  return testDefaultPuppeteer();
}).then(() => {
  console.log('\n🏁 Chrome detection test complete!');
}).catch(console.error);
