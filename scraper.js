const puppeteer = require('puppeteer');


async function scrapeGoogleMapsReviews(url) {
  // Launch Puppeteer browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disabled-setuid-sandbox'],
  });
  const page = await browser.newPage();


  // Navigate to the review page
  await page.goto(url);


  // Get the number of reviews
  const reviewAmount = await page.evaluate(() => {
    const reviewString = document.querySelector('#QA0Szd > div > div > div.w6VYqd > div:nth-child(2) > div > div.e07Vkf.kA9KIf > div > div > div.m6QErb.DxyBCb.kA9KIf.dS8AEf > div.PPCwl > div > div.jANrlb > div.fontBodySmall').textContent;
    return parseInt(reviewString.match(/^\d+/));
  });


  // Scroll and wait for reviews to load
  let endLoop = true;
  let prevNum;
  let loopCounter = 0;


  while (endLoop) {
    await page.evaluate(() => {
      const leftside = document.querySelector('#QA0Szd > div > div > div.w6VYqd > div:nth-child(2) > div > div.e07Vkf.kA9KIf > div > div > div.m6QErb.DxyBCb.kA9KIf.dS8AEf');
      leftside.scrollBy(0, leftside.clientHeight * 2);
      leftside.scrollBy(0, -10);
    });


    await page.waitForSelector('div.d4r55');


    endLoop = await page.evaluate((reviewAmount) => {
      currentReview = document.querySelectorAll('div.d4r55');


      if (document.querySelectorAll('div.d4r55').length == reviewAmount) {
        return false;
      } else return true;
    }, reviewAmount);


    let numOn = await page.evaluate(() => {
      return document.querySelectorAll('div.d4r55').length;
    });


    if (numOn == prevNum) {
      loopCounter++;
    } else {
      loopCounter = 0;
    }
  //throw error if page does not load
    if (loopCounter > 1000 ) {
      await browser.close();
     throw new Error("Error: Google review page stopped loading");
    }


    prevNum = numOn;
   
  }


  // Expand all "More" buttons to load reviews
  await page.evaluate(() => {
    let allMoreBtns = document.querySelectorAll('span:nth-child(2) > button');
    for (let y = 0; y < allMoreBtns.length; y++) {
      allMoreBtns[y].click();
    }
  });


  // Extract reviews
  const reviews = [];


  for (let x = 0; x < reviewAmount; x++) {
    reviews.push(await page.evaluate((counter) => {
      const name = document.querySelectorAll('div.d4r55')[counter].textContent;
      const rating = document.querySelectorAll('span.kvMYJc')[counter].getAttribute('aria-label');


      let text = document.querySelectorAll('span.wiI7pd')[counter];
      if (text == undefined) {
        text = '';
      } else {
        text = text.textContent;
      }


      const date = document.querySelectorAll('span.rsqaWe')[counter].textContent;
      return { name, rating, text, date };
    }, x));
  }


 
  await browser.close(); // Close the browser
  return reviews; //return array of objects with reviews
}


module.exports = scrapeGoogleMapsReviews;
