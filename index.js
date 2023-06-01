const scrapeGoogleMapsReviews = require('./scraper');
const URL = "https://www.google.com/maps/place/McDonald's/@37.4420923,-122.1706252,17.75z/data=!4m8!3m7!1s0x808fbb35a51e7785:0x850644c640e8dc91!8m2!3d37.4426401!4d-122.1705019!9m1!1b1!16s%2Fg%2F1w04kbls?entry=ttu";
scrapeGoogleMapsReviews(URL)
  .then((reviews) => {
    console.log(reviews);
   
   
  })
  .catch((error) => {
    console.error(error);
  });
