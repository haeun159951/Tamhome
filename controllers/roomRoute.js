const express = require("express");
const router = express.Router();
const path = require("path");
const app = express();
const roomModel = require("../models/roomModel");
const bookModel = require("../models/bookModel");
const {
  authenticatedForAdmin,
  authenticated,
} = require("../middleware/userAuth");
const multer = require("multer");
const nodemailer = require("nodemailer");

const storage = multer.diskStorage({
  destination: "./public/photos/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.basename(file.originalname));
  },
});

const upload = multer({ storage: storage });

//show all the rooms to anyone && call all the data from database
router.get("/roomList", function (req, res) {
  roomModel
    .find({})
    .exec()
    .then((rooms) => {
      res.render("roomList", {
        rooms,
        fname: req.session.user ? req.session.user.fname : "",
        isAdmin: req.session.user && req.session.user.isAdmin,
      });
    })
    .catch((err) => {
      res.render("roomList", { message: err.message });
    });
});

// Search module - location filter
router.get("/roomList/:location", function (req, res) {
  cityFilter =
    req.params.location === "all" ? {} : { location: req.params.location };
  roomModel
    .find(cityFilter)
    .exec()
    .then((rooms) => {
      res.render("roomList", {
        rooms,
        fname: req.session.user ? req.session.user.fname : "",
        isAdmin: req.session.user && req.session.user.isAdmin,
      });
    })
    .catch((err) => {
      res.render("roomList", { message: err.message });
    });
});

// common - validation for edit & add
function editOrSave(req, res, edit, callback) {
  const errors = [];
  const { title, price, description, location } = req.body;
  if (title === "") {
    errors.push("Please enter room name");
  }
  if (price === "") {
    errors.push("Please enter a price");
  }
  if (description === "") {
    errors.push("Please enter a description");
  }
  if (location === "") {
    errors.push("Please enter a location");
  }
  if (req.file === undefined || req.file === "") {
    errors.push("Please upload a room image");
  }

  if (errors.length > 0) {
    res.render("addRoom", {
      message: errors,
      edit: edit,
      title: title,
      price: price,
      description: description,
      location: location,
    });
  } else {
    console.log("file:", req.file);
    const room = {
      title: req.body.title,
      price: req.body.price,
      description: req.body.description,
      location: req.body.location,
      pic:
        req.file &&
        req.file.path.substring(
          req.file.path.indexOf(
            process.platform.substring(0, 3) === "win" ? "\\" : "/"
          )
        ),
    };

    if (req.body.room_id) room.id = req.body.room_id;
    console.log(room);
    callback(room);
  }
}

//1. Add new room
router.get("/add", authenticatedForAdmin, (req, res) => {
  res.render("addRoom", {
    room: {},
    edit: false,
    fname: req.session.user.fname,
    lname: req.session.user.lname,
    isAdmin: req.session.user.isAdmin,
  });
});

router.post("/add", authenticatedForAdmin, upload.single("pic"), (req, res) => {
  editOrSave(req, res, false, (newRoom) => {
    const room = new roomModel(newRoom);
    room
      .save()
      .then((newRoom) => {
        console.log(`added in the database`);
        res.redirect("/room/roomList");
      })
      .catch((err) => console.log(`Error: ${err}`));
  });
});

//2. Edit a room
router.get("/edit", authenticatedForAdmin, (req, res) => {
  let roomId = req.query.id;
  roomModel
    .findById(roomId)
    .then((room) => {
      res.render("addRoom", {
        room,
        edit: true,
        title: room.title,
        price: room.price,
        description: room.description,
        location: room.location,
        fname: req.session.user.fname,
        lname: req.session.user.lname,
        isAdmin: req.session.user.isAdmin,
      });
    })
    .catch((err) => console.log(`Error editing from the database: ${err}`));
});

router.post(
  "/edit",
  authenticatedForAdmin,
  upload.single("pic"),
  (req, res) => {
    editOrSave(req, res, true, (room) => {
      console.log(room);
      roomModel
        .updateOne(
          { _id: room.id },
          {
            $set: {
              title: room.title,
              price: room.price,
              description: room.description,
              location: room.location,
              pic: room.pic,
            },
          }
        )
        .exec()
        .then((room) => {
          console.error(`Edited in the database`);
          res.redirect("/room/roomList");
        })
        .catch((err) => console.log(`Error: ${err}`));
    });
  }
);

//3. Delete room
router.get("/delete/:roomid", authenticatedForAdmin, (req, res) => {
  roomModel
    .deleteOne({ _id: req.params.roomid })
    .then((err) => {
      console.error(`deleted in the database`);
      res.redirect("/room/roomList");
    })
    .catch((err) =>
      console.error(`Error with deleting data from the database : ${err}`)
    );
});

//  room-detail database
router.get("/detail/:roomid", (req, res) => {
  let user = req.session.user;
  roomModel
    .findById({ _id: req.params.roomid })
    .exec()
    .then((room) =>
      res.render("detail", {
        room: room,
        fname: user ? user.fname : "",
        isAdmin: user ? user.isAdmin : "",
      })
    )
    .catch((err) => res.redirect("/"));
});

async function sendEmail(user, room, book) {
  var transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    service: "gmail",
    secure: false,
    port: 587,
    ignoreTLS: false,
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PWD,
    },
  });

  var emailOptions = {
    from: process.env.NODEMAILER_EMAIL,
    to: user.email,
    subject: "Tamhome",
    html: `
            <p>Hello ${user.fname}, <br>
            This is your booking information at Tamhome</p>
            <p> Room: ${room.title} </p>
            <p> Price: ${book.total} </p>
            <p> Check-in: ${book.checkIn.toDateString()} </p>
            <p> Check-out: ${book.checkOut.toDateString()} </p>
            <p>Thank you for booking at Tamhome! Have a nice day!</p>
            `,
  };
  transporter.sendMail(emailOptions, (error, info) => {
    if (error) {
      console.log("Error: " + error);
    }
    console.log(process.env.NODEMAILER_EMAIL, process.env.NODEMAILER_PWD);
    console.log("Success: ", info, error);
  });
}

router.post("/detail/:roomid", authenticated, async function (req, res) {
  req.body.userId = req.session.user._id;
  req.body.roomId = req.params.roomid;
  const room = await roomModel.findById(req.body.roomId);
  const book = new bookModel(req.body);
  await book.save();
  await sendEmail(req.session.user, room, book);
  res.redirect("/room/book");
});

router.get("/book", authenticated, function (req, res) {
  res.render("book", {
    fname: req.session.user.fname,
    lname: req.session.user.lname,
  });
});

router.get("/mybooking", authenticated, async function (req, res) {
  const books = await bookModel.find({ userId: req.session.user._id });
  const rooms = await Promise.all(
    books.map((e) => roomModel.findById(e.roomId))
  );
  let bookings = [];
  books.forEach((book) => {
    book.formattedCheckIn = book.checkIn.toDateString();
    book.formattedCheckOut = book.checkOut.toDateString();
    let room = rooms.filter((room) => room && room._id == book.roomId)[0];
    bookings.push({ book, room });
  });
  console.log(bookings);
  res.render("myBooking", {
    bookings,
    fname: req.session.user.fname,
    lname: req.session.user.lname,
  });
});

module.exports = router;
