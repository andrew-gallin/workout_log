const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const moment = require('moment')

const cors = require('cors')

const mongoose = require('mongoose'),
      autoIncrement = require('mongoose-auto-increment');
const Schema = mongoose.Schema
let connection = mongoose.createConnection(process.env.MLAB_URI)
autoIncrement.initialize(connection)

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

let User_Schema = new Schema({
  user: {type:String, unique:true}
})

let Workout_Schema = new Schema({
  userId: {type:String, unique:false},
  description: String,
  duration: Number,
  date: String
})

User_Schema.plugin(autoIncrement.plugin, {model: 'User_Schema', field: 'userId'});

let User_model = connection.model('User', User_Schema)
let Workout_model = connection.model('Workouts', Workout_Schema)

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

app.post('/api/exercise/new-user', async function (req, res) {
  let username = req.body.username
  let record = new User_model({user: username})
  try{
      let result = await record.save();
      res.json(result)
    }
    catch(err){
      if (err.name === 'MongoError' && err.code === 11000) {
        res.status(409).json({'Error': err.message});
      }
      else{res.status(500).send(err)};
    }
})

app.post('/api/exercise/add', async function (req, res){
  let userId = req.body.userId
  let description = req.body.description
  let duration = req.body.duration
  let date = req.body.date
  let record = new Workout_model({userId: userId,
                                 description: description,
                                 duration: duration,
                                 date: date})
  let IsoTrue = moment(date, moment.ISO_8601, true).isValid()
  if(!IsoTrue){res.json({'Error': 'Inavilid Date'})}
  else{
    try{
        let result = await record.save();
        res.json(result)
      }
      catch(err){
        console.log(err)
        if (err.name === 'MongoError' && err.code === 11000) {
          res.status(409).json({'Error': err.message});
        }
        else{res.status(500).send(err)};
      }
  }
})

app.get('/api/exercise/users', function (req, res){
  try{
    let entries = User_model.find({}, (err, users) => {
      res.json(users)
    })
  }
  catch(err){
    if (err.name === 'MongoError' && err.code === 11000) {
      res.status(409).json({'Error': err.message});
    }
    else{res.status(500).send(err)};
  }
})

app.get('/api/exercise/users/log/:user/:from?/:to?/:limit?', function (req, res){
  let userId = req.params.user
  let from = req.params.from
  let to = req.params.to
  let limit= req.params.limit
  
  Workout_model.find({ name: 'john', age: { $gte: 18 }});
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
