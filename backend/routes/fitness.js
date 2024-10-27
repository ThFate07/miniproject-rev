const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

const secret = "your_jwt_secret";

router.post("/add-fitness-details", authMiddleware, (req, res) => {
  const {
    email,
    water_intake,
    exercise_duration,
    blood_sugar_level,
    weight,
    calories_intake,
  } = req.body;

  const findUserIdQuery = "SELECT id FROM users WHERE email = ?";
  db.query(findUserIdQuery, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = results[0].id;

    const checkQuery = `SELECT date FROM fitness_details WHERE user_id = ?`;
    db.query(checkQuery, [userId], (err, result) => {
      if (result.length > 0) {
        const utcDate = new Date(result.at(-1).date); // UTC date from MySQL
        const localDate = new Date(
          utcDate.getTime() - utcDate.getTimezoneOffset() * 60000
        )
          .toISOString()
          .substring(0, 10);

        const currentDate = new Date().toLocaleDateString("en-CA");

        if (localDate === currentDate) {
          return res
            .status(400)
            .json({ message: "Already filled entry for today" });
        }
      }
      // Insert fitness details into the fitness_details table
      const insertQuery = `
                    INSERT INTO fitness_details (user_id, water_intake_ml, workout_minutes, blood_sugar_level, weight, calories_intake) VALUES (?, ?, ?, ?, ?, ?)
                `;
      db.query(
        insertQuery,
        [
          userId,
          water_intake,
          exercise_duration,
          blood_sugar_level,
          weight,
          calories_intake,
        ],
        (err, result) => {
          if (err) {
            return res.status(500).json({
              message: "Error inserting fitness details",
              error: err,
            });
          }

          res
            .status(200)
            .json({ message: "Fitness details added successfully" });
        }
      );
    });
  });
});

router.post("/get-fitness-data", (req, res) => {
  const { email } = req.body;
  // Find user ID based on the email
  const findUserIdQuery = "SELECT id FROM users WHERE email = ?";
  db.query(findUserIdQuery, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = results[0].id;

    // Fetch fitness data from the fitness_table for this user_id
    const fetchFitnessDataQuery = `
                SELECT id,water_intake_ml, workout_minutes, blood_sugar_level, steps_walked, weight,calories_intake,date FROM fitness_details WHERE user_id = ?
            `;
    db.query(fetchFitnessDataQuery, [userId], (err, fitnessData) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error fetching fitness data", error: err });
      }

      if (fitnessData.length === 0) {
        return res
          .status(404)
          .json({ message: "No fitness data found for this user" });
      }

      // Return the fitness data
      res.status(200).json({ fitnessData });
    });
  });
});

router.post("/delete-fitness-data", (req, res) => {
  const { date, email } = req.body;

  // Find user ID based on the email
  const findUserIdQuery = "SELECT id FROM users WHERE email = ?";
  db.query(findUserIdQuery, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = results[0].id;

    // Delete fitness data for the specific user and date
    const deleteQuery = `
            DELETE FROM fitness_details 
            WHERE user_id = ? AND DATE(date) = ?
        `;
    db.query(deleteQuery, [userId, date], (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error deleting fitness data", error: err });
      }

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ message: "No fitness data found for the specified date" });
      }

      res
        .status(200)
        .json({ message: "Successfully deleted the fitness data" });
    });
  });
});

router.post("/update-fitness-data", (req, res) => {
  const { date, email, updateInput } = req.body;

  // Find user ID based on the email
  const findUserIdQuery = "SELECT id FROM users WHERE email = ?";
  db.query(findUserIdQuery, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = results[0].id;

    // Set default values for missing fields
    const validatedInput = Object.entries(updateInput).reduce(
      (acc, [key, value]) => {
        if (value !== "") {
          acc[key] = value;
        }
        return acc;
      },
      {}
    );

    // Update fitness data for the specific user and date
    const updateQuery = `
            UPDATE fitness_details 
            SET ? 
            WHERE user_id = ? AND DATE(date) = ?
        `;
    db.query(updateQuery, [validatedInput, userId, date], (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error updating fitness data", error: err });
      }

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ message: "No fitness data found for the specified date" });
      }

      res
        .status(200)
        .json({ message: "Successfully updated the fitness data" });
    });
  });
});

router.post("/add-goal", authMiddleware, (req, res) => {
  const { email, calorieGoal, stepsGoal, workoutGoal, sleepGoal} = req.body;

  // Find user ID based on the email
  const findUserIdQuery = "SELECT id FROM users WHERE email = ?";
  db.query(findUserIdQuery, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = results[0].id;

    // Update goal data for the specific user
    const updateQuery = `
      UPDATE users 
      SET Goals = ? 
      WHERE id = ?
    `;

   
    db.query(updateQuery, [JSON.stringify({ calorieGoal, stepsGoal, workoutGoal, sleepGoal }), userId], (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error updating fitness goals", error: err });
      }

      res.status(200).json({ message: "Successfully updated goals" });
    });
  });
});

router.post("/get-goals", authMiddleware, (req, res) => {
  const { email } = req.body;

  // Find user ID based on the email
  const findUserIdQuery = "SELECT id FROM users WHERE email = ?";
  db.query(findUserIdQuery, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = results[0].id;

    // Fetch goals data for the specific user
    const fetchGoalsQuery = `
      SELECT Goals FROM users WHERE id = ?
    `;
    db.query(fetchGoalsQuery, [userId], (err, goalsData) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error fetching goals data", error: err });
      }

      if (goalsData.length === 0) {
        return res.status(404).json({ message: "No goals found for this user" });
      }

      
      // Return the goals data
      res.status(200).json({ Goals: goalsData[0].Goals });
    });
  });
});
module.exports = router;

