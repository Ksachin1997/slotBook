# BookAppointmentGHL

#EndPonits

Total 3 end points are there.

---> http://localhost:5001/bookappointmentghl/us-central1/app/api/create 
      Using this events can be added to firestore collection and status 200 is returned and all time slots that are booked for this event are displayed.
      If event already exists or any illegal event is created status 422 is returned with message "event already exist or illegal event".
      
      sample body:
      {   
          "id" : 7,
          "date" : "2020-11-25",
          "hour" : "12:30",
          "duration" : 55
      }
      
--->  http://localhost:5001/bookappointmentghl/us-central1/app/api/get/:date/:country/:city
      example endpoint:   http://localhost:5001/bookappointmentghl/us-central1/app/api/get/2020-11-25/Asia/Kolkata
      Using this free time slots are displayed for the date passed in params and also time slots to converted to timezones based on country and city passed in params.
      
--->  http://localhost:5001/bookappointmentghl/us-central1/app/api/get/:date/:dateEnd
      example endpoint:   http://localhost:5001/bookappointmentghl/us-central1/app/api/get/2020-11-22/20-11-25
      Using this all the timeslots which are booked between given dates passed in params are displayed.
      
      
#SetUp

---> Softwares needed Visual Studio(for running the application), Postman(for testing the application)
---> Create account on firebase and use Cloud firestore(for storing the events)
---> Download the project and open with visual studio.
---> Install firebase and Login to firebase and initialise firebase.
---> Using  "npm run serve" start the localhost server.
---> Write the above endpoints in Postman and test it.

#Database design

--->It has a collection named events.
--->It has documents with fields id(Number), date(TimeStamp), events(array[timestamp]), hour(string).
      
      
      
