const puppeteer = require('puppeteer');
const {Storage} = require('@google-cloud/storage');


async function scrapeGoogleMapsReviews(url) {
  // Launch Puppeteer browser
  try {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disabled-setuid-sandbox'],
  });
  const page = await browser.newPage();


//create google cloud storage object
const googleCloud = new Storage({
keyFilename: 'path location to key file.json',
projectId: 'project id number,found in key file'
});



  // Navigate to the review page
  await page.goto(url);



  // Get the number of reviews
  let reviewOn;
  let reviewAmount = await page.evaluate(() => {
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
      break;
    }


    prevNum = numOn;
   reviewOn = numOn;
  }


  // Expand all "More" buttons to load reviews
  await page.evaluate(() => {
    let allMoreBtns = document.querySelectorAll('span:nth-child(2) > button');
    for (let y = 0; y < allMoreBtns.length; y++) {
      allMoreBtns[y].click();
    }
  });


  
  const reviews = [];


  reviewAmount = reviewOn;
// Extract reviews and adds them too array
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





  //Sends reviews in JSON format to the bucket, fill in bucketName with the bucket name in google cloud and fileName should be the desired name of the JSON file that will be uploaded
  async function uploadFile(jsonReviews) {
    const bucketName = 'BUCKET NAME HERE';
    const fileName = 'NAME OF FILE.json';
  
    await googleCloud.bucket(bucketName).file(fileName).save(jsonReviews);
  }

  //runs function
  uploadFile(JSON.stringify({reviewOn,reviews})).catch(console.error);
 
  await browser.close(); // Close the browser
  return JSON.stringify({reviewOn,reviews}); //return array of objects with reviews in json format
} catch (error) {
  console.error('An error occurred:', error);
  return []; // Return an empty array if error is caught

}
}


module.exports = scrapeGoogleMapsReviews;
