const functions = require('firebase-functions');
const admin = require('firebase-admin');


var serviceAccount = require("./permissions.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bookappointmentghl.firebaseio.com"
});

const db = admin.firestore();

const express = require('express');
const app = express();

const cors = require('cors');
app.use(cors({origin:true}));

const config = {
  "Start Hours": "08:00",
  "End Hours": "17:00",
  "Slot Duration": 50,
  "Timezone":"US/Eastern"
}

const generateSlots = (date) => {

  let StartHrs = config["Start Hours"].substring(0,2);
  let StartMins = config["Start Hours"].substring(3);
  let EndtHrs = config["End Hours"].substring(0,2);
  let EndMins = config["End Hours"].substring(3);

  let d = new Date(date);
  d.setHours(Number(StartHrs));
  d.setMinutes(Number(StartMins))
  let e = new Date(date);
  e.setHours(Number(EndtHrs));
  e.setMinutes(Number(EndMins));

  let dTimeStamp = +d;
  let eTimeStamp = +e;

  let slots = [];
  while(dTimeStamp < eTimeStamp){
    let newDate = new Date(dTimeStamp);
    slots.push(newDate);
    dTimeStamp += config["Slot Duration"]*60000;
  }

  return slots;

}

app.get('/api/get/:date/:dateEnd', (req,res) => {

    (async () => {
      let allData = [];

      const collection = db.collection('events');
      const snapShot = await collection.get();

      snapShot.forEach(doc => {
        allData.push(doc.data());
      })

      const filteredData = allData.filter((data) => {
        return data.date._seconds*1000 + data.date._nanoseconds >= new Date(req.params.date).getTime() && data.date._seconds*1000 + data.date._nanoseconds <= new Date(req.params.dateEnd).getTime()
      })

      let bookedEvents = []

      filteredData.forEach((data) => {
        data.event.forEach((time) => {
          let bookedTime = new Date(time._seconds*1000+time._nanoseconds);
          bookedEvents.push(bookedTime);
        })
      })

      return res.status(200).send(bookedEvents);
      
    })();
    
});

app.get("/api/get/:date/:country/:city", (req,res) => {

  let slots = generateSlots(req.params.date);

  (async () => {
    let allData = [];

    const collection = db.collection('events');
    const snapShot = await collection.get();

    snapShot.forEach(doc => {
      allData.push(doc.data());
    })

    const filteredData = allData.filter((data) => {
      return data.date._seconds*1000 + data.date._nanoseconds === new Date(req.params.date).getTime()
    })

    let bookedSlots = []

    filteredData.forEach((data) => {
      data.event.forEach((time) => {
        let bookedTime = new Date(time._seconds*1000+time._nanoseconds);
        bookedSlots.push(bookedTime);
      })
    })
    
    let filteredSlots = [];

    slots.forEach((e) => {
      let f = 0
      bookedSlots.forEach((be) => {
        if(+e === +be){
          f = 1;
        }
      })
      if(f === 0){
        filteredSlots.push(e);
      }
    })

    const mappedSlots = filteredSlots.map((e) => {
      e = e.toLocaleString("en-US", {timeZone: req.params.country+"/"+req.params.city});
      return e;
    })
  
    return res.status(200).send(mappedSlots);

    
    
  })();


})


app.post("/api/create", (req,res) => {

  let duration = req.body.duration;
  let date = new Date(req.body.date);
  let slots = generateSlots(date);
  let dateStart = new Date(req.body.date);
  dateStart.setHours(Number(req.body.hour.substring(0,2)));
  dateStart.setMinutes(Number(req.body.hour.substring(3)));
  let dTimeStamp = +dateStart;
  let dateEnd = new Date(dTimeStamp+duration*60000);
  let eTimeStamp = +dateEnd;

  let slotStart = null;
  let slotEnd = null;

  for(let i=0;i<slots.length;i++){
    if(i == 0 && +slots[i] === dTimeStamp){
      slotStart = slots[i];
      break;
    }
    if(i > 0 && +slots[i] > dTimeStamp){
      slotStart = slots[i-1];
      break;
    }
    if(i > 0 && +slots[i] === dTimeStamp){
      slotStart = slots[i];
      break;
    }
  }

  for(let i=0;i<slots.length;i++){
    if(+slots[i] >= eTimeStamp){
      slotEnd = slots[i];
      break;
    }
  }

  let slotStartTimeStamp = +slotStart;
  let slotEndTimeStamp = +slotEnd;

  let newSlots = []

  while(slotStartTimeStamp < slotEndTimeStamp){
    let newDate = new Date(slotStartTimeStamp);
    newSlots.push(newDate);
    slotStartTimeStamp += config["Slot Duration"]*60000;
  }

  

  (async () => {

    let allData = [];

    const collection = db.collection('events');
    const snapShot = await collection.get();

    snapShot.forEach(doc => {
      allData.push(doc.data());
    })

    const filteredData = allData.filter((data) => {
      return data.date._seconds*1000 + data.date._nanoseconds === date.getTime()
    })

    let bookedSlots = []

    filteredData.forEach((data) => {
      data.event.forEach((time) => {
        let bookedTime = new Date(time._seconds*1000+time._nanoseconds);
        bookedSlots.push(bookedTime);
      })
    })

    bookedSlots.forEach((be) => {
      newSlots.forEach((ne) => {
        if(+be === +ne){
          newSlots = [];
        }
      })
    })

    if(newSlots.length === 0){
      return res.status(422).send("event already exists or illegal event");
    }

    await collection.doc('/'+req.body.id+'/')
    .create({
      event: newSlots,
      duration: duration,
      date: date,
      hour: req.body.hour
    })

    return res.status(200).send(newSlots);

  })();

})


exports.app = functions.https.onRequest(app);
