let mongoose = require('mongoose');

//import surveys model
let survey = require('../models/surveys');
let answerSchema = require('../models/answer');
let questionSchema = require('../models/question');

//convert to timezone
let moment = require('moment-timezone');




// read and display the survey list
module.exports.ReadSurveyList = (req, res) => {
    //get today's date
    let currentDate = new Date();
    let evi = process.env.localEvi;
    //currentDate.setTime(currentDate.getTime()+(moment().utcOffset()*60*1000));
    let timezone = moment.tz.guess();
    if (evi != null || evi == "online"){
        currentDate.setTime(currentDate.getTime()+((moment().utcOffset())*60*1000));
    }
    console.log(moment().utcOffset());
    
    //only show the expireDate is after currentDate
    survey.find({ expireDate: { $gt: currentDate.toString() } }, (err, surveys) => {
        if (err) {
            return console.error(err);
        }
        else {
            res.render('surveys/index', {
                title: timezone,//moment().tz("America/Toronto").format('Z'),
                surveys: surveys,
                displayName: req.user ? req.user.displayName : ''
            })
        }
    });
}

// Display create survey ejs page
module.exports.DisplayAdd = (req, res) => {

    let query = require('url').parse(req.url, true).query;
    let topic = query.topic;
    let numberOfQuestion = query.numberOfQuestion;
    let type = query.type;

    /*
    let topic = req.params.topic;
    let numberOfQuestion = req.params.numberOfQuestion;
    let type = req.params.type;*/

    res.render('surveys/create', {
        title: "Create Survey",
        surveys: '',
        displayName: req.user.displayName,
        userid: req.user._id,
        numberOfQuestion: parseInt(numberOfQuestion),
        topic: topic,
        type: type
    });
}

// Create a new survey and insert it into the db
module.exports.CreateSurvey = (req, res) => {
    try {


        let currentDate = moment().utc().format().toString(); 
        //console.log(currentDate);
        let timeOffset = req.body.timeOffset;
        console.log(currentDate);
        let expireDate =  moment.utc(Date.parse(req.body.expireDate)).add(timeOffset,'m').format().toString();
        console.log(expireDate);
        //create question objects
        let numberOfQuestion = req.body.numberOfQuestion;
        //console.log(numberOfQuestion);
        //console.log(req.body['questionAns11']);
        //console.log(req.body['questionAns' + 1 + '2']);
        //console.log(req.body['questionAns' + 1 + '3']);
        //let Question = questionSchema;
        //let Answer = answerSchema;
        let questionArray = [];
        let type = req.body.type;
        //create questions accorder to the numberOfQuestion
        for (var i = 1; i <= numberOfQuestion; ++i) {
           if(type == 1 || type == 2){
               if(req.body['questionAns' + i + '3'] != ""){
                  let question = {
                    "questionTopic": req.body['questionTopic' + i],
                    "questionAns":
                    [
                        { "answer": req.body['questionAns' + i + '1'] },
                        { "answer": req.body['questionAns' + i + '2'] },
                        { "answer": req.body['questionAns' + i + '3'] }
                    ],
                    "type": req.body.type
                }
                 questionArray.push(question);
               }
               else{
                   let question = {
                    "questionTopic": req.body['questionTopic' + i],
                    "questionAns":
                    [
                        { "answer": req.body['questionAns' + i + '1'] },
                        { "answer": req.body['questionAns' + i + '2'] }       
                    ],
                    "type": req.body.type
                }
                 questionArray.push(question);
               }
                
           }
           else if(type ==3){
                  let question = {
                    "questionTopic": req.body['questionTopic' + i],
                    "type": req.body.type
                }
                 questionArray.push(question);
           }    
        }

        console.log(questionArray);
        //console.log(req.body.userid);
        console.log(questionArray[0].questionAns);


        // get a reference to the id from the url
        //let id = mongoose.Types.ObjectId.createFromHexString(req.params.id);
        let newSurvey = survey({
            "topic": req.body.topic,
            "user": req.user._id,
            "createDate": currentDate,
            "expireDate": expireDate,//req.body.date,
            "questions": questionArray,
            /* schema model template
            [
                { "questionTopic" : req.body.questionTopic1,
                  "questionAns" : 
                  [
                      { "answer" : req.body.questionAns11 },
                      { "answer" : req.body.questionAns12 },
                      { "answer" : req.body.questionAns13 }                               
                  ],
                  "type" : 1
                },
                {
                  "questionTopic" : req.body.questionTopic2,
                  "questionAns" : 
                  [
                      { "answer" : req.body.questionAns21 },
                      { "answer" : req.body.questionAns22 },
                      { "answer" : req.body.questionAns23 }                               
                  ],
                  "type" : 1
                }
            ]*/

        });


        survey.create(newSurvey, (err, survey) => {
            if (err) {
                console.log(err);
                res.end(err);
            } else {
                res.redirect('/surveys/mySurveys');
            }
        });
    }
    catch (err) {
        console.log(err);
        res.redirect('/errors/404');
    }
}

// display the survey page
// find survey by survey id
module.exports.DisplayResponse = (req, res) => {

    try {
        // get a reference to the id from the url
        let id = mongoose.Types.ObjectId.createFromHexString(req.params.id);

        // find one survey by its id
        survey.findById(id, (err, surveys) => {
            if (err) {
                console.log(err);
                res.end(error);
            } else {
                // show the survey page
                res.render('surveys/response', {
                    title: surveys.topic,
                    user: surveys.user,
                    type: surveys.questions[0].type,
                    surveys: surveys,
                    displayName: req.user ? req.user.displayName : '',
                });
            }
        });
    } catch (err) {
        console.log(err);
        res.redirect('/errors/404');
    }
}

// Process the response survey request
module.exports.ResponseSurvey = (req, res) => {
    let numberofQuestions = req.body.numberofQuestions;
    console.log(numberofQuestions);
    let questionArray = [];
    for (var i = 0; i < numberofQuestions; ++i) {

        let question = {
            "questionTopic": req.body['questionTopic' + i],
            "questionAns": req.body['question' + i]
        }

        questionArray.push(question);
    }


    let newResponse = answerSchema({
        "surveyTopic": req.body.surveyTopic,
        "user": req.body.userId,
        "questions": questionArray,
    });


    answerSchema.create(newResponse, (err, answer) => {
        try {
            if (err) {
                console.log(err);
                res.end(err);
            } else {
                res.redirect('/surveys');
            }
        } catch (err) {
            console.log(err);
            res.redirect('/errors/404');
        }
    });
}

// Display surveys list by user id
module.exports.ReadUserSurvey = (req, res) => {
    let userId = req.user._id;
     //only show the surveys created by the user
    survey.find({ user: userId }, (err, surveys) => {
        if (err) {
            return console.error(err);
        }
        else {
            res.render('surveys/userSurvey', {
                title: 'My Surveys List',
                surveys: surveys,
                displayName: req.user.displayName,
            })
        }
    });
}

//display the survey detail page
module.exports.ViewMySurvey =  (req, res) => {
    try {
       let id = mongoose.Types.ObjectId.createFromHexString(req.params.id);
        // find one survey by its id
        survey.findById(id, (err, surveys) => {
            if (err) {
                console.log(err);
                res.end(error);
            } else {
                // show the survey page
                res.render('surveys/surveyDetail', {
                    title: surveys.topic,
                    user: surveys.user,
                    type: surveys.questions[0].type,
                    surveys: surveys,
                    displayName: req.user.displayName
                });
            }
        });
    } catch (err) {
        console.log(err);
        res.redirect('/errors/404');
    }
}

// Delete the survey by the survey id
module.exports.DeleteSurvey = (req, res) => {
        // get a reference to the id from the url
        let id = mongoose.Types.ObjectId.createFromHexString(req.params.id);

    survey.remove({_id: id}, (err) => {
      if(err) {
        console.log(err);
        res.end(err);
      } else {
        // refresh the my survey list
        res.redirect('/surveys/mySurveys');
      }
    });
}


//Display the inital page for creating a survey
module.exports.DisplayInitialPage = (req, res) => {
    res.render('surveys/init', {
        title: "Create Survey",
        surveys: '',
        games: '',
        displayName: req.user.displayName,
        userid: req.user._id
    });
}

//Go to next step to input questions and answers
module.exports.GotoCreatePage = (req, res) => {
    //
    console.log(req.body.numberOfQuestion);
    console.log(req.body.topic);

    console.log(req.body.type);
    let numberOfQuestion = parseInt(req.body.numberOfQuestion)
    //redirect params to create page
    res.redirect('/surveys/create/' + '?topic=' + req.body.topic + '&type=' + req.body.type + '&numberOfQuestion=' + numberOfQuestion);
}