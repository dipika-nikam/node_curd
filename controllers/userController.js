const express = require("express");
const Joi = require('joi');
const bcrypt = require("bcrypt");
const User = require('../models/userModel')
const app = express()
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const verifyToken = require('../middleware/authMiddleware')

require('dotenv').config();
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const userSchema = Joi.object({
    username: Joi.string()
        .regex(/^[A-Za-z]+(?: [A-Za-z0-9.,()\-]+)*$/)
        .trim()
        .required(),
    email:
        Joi.string()
            .email()
            .required(),
    password:
        Joi.string()
            .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/)
            .required(),
});


exports.userRegister = async (req, res) => {
    try {
        const { error, value } = userSchema.validate(req.body);
        if (error) {
            if (error.message.includes('"password"')) {
                if (error.message.includes('"password" is required')) {
                    return res.status(422).json({
                        success: false,
                        message: 'Password is required for login',
                    });
                }
                return res.status(422).json({
                    success: false,
                    message: 'Password must be 8 characters long and also conatain number, sepical characters and capital letterts.',
                });
            } else if (error.message.includes('"username"')) {
                if (error.message.includes('"username" is required')) {
                    return res.status(422).json({
                        success: false,
                        message: 'username is required for login',
                    });
                }
                return res.status(422).json({
                    success: false,
                    message: "You can't start username with number",
                });
            }
            else if (error.message.includes('"email"')) {
                if (error.message.includes('"email" is required')) {
                    return res.status(422).json({
                        success: false,
                        message: 'email is required for login',
                    });
                }
                return res.status(422).json({
                    success: false,
                    message: "Plase eneter valid email ID",
                });
            }
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const hashedPassword = await bcrypt.hash(value.password, 10);
        const user = await User.create({
            username: value.username,
            email: value.email,
            password: hashedPassword
        });

        res.status(201).json({ success: true, data: value, message: 'User registered successfully' });
    } catch (error) {
        console.log(error.keyValue.email);
        if (error.code === 11000 && error.keyPattern && error.keyValue.username) {
            const duplicateKeyName = Object.keys(error.keyPattern)[0];
            const duplicateKeyValue = error.keyValue[duplicateKeyName];
            return res.status(400).json({ success: false, message: `User name alraedy taken please use other username` });
        } else if (error.code === 11000 && error.keyPattern && error.keyValue.email) {
            const duplicateKeyName = Object.keys(error.keyPattern)[0];
            const duplicateKeyValue = error.keyValue[duplicateKeyName];
            return res.status(400).json({ success: false, message: `Email already exists` });
        }
        else {
            console.error('Error during product creation:', error);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }
}

exports.userLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ success: false, message: 'You are not register user' });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const accessToken = jwt.sign(
            {
                user: {
                    username: user.username,
                    email: user.email,
                    id: user.id,
                },
            },
            process.env.JWT_SECRET,
            { expiresIn: "15h" }
        );

        res.status(200).json({ success: true, data: req.body, token: accessToken, message: "You are login sucessfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'User name and password not valid' });
    }
}

async function getUserFromToken(token) {
    try {
        const tokenWithoutBearer = token.split(' ')[1];
        const decodedToken = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET); 
        return decodedToken;
    } catch (error) {
      return null;
    }
  }

exports.updatedUser = async (req, res) => {
    try {
        const decodedToken = await getUserFromToken(req.headers.authorization);
        const userId = decodedToken.user.id;
        const userFound = await User.findById(userId);

        if (!userFound) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const value = req.body;

        if (!value) {
            return res.status(400).json({ success: false, message: 'Value is required for update' });
        }
        // let decryptedPassword;
        if (value.password) {
            res.status(401).json({ success: false, message: "you can't change password from here" })
            // decryptedPassword = value.password;
            // value.password = await bcrypt.hash(value.password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(userId, value, {
            new: true,
            runValidators: true,
        });
        const responseUser = { ...updatedUser.toObject() };
        delete responseUser.password;
        res.status(200).json({ success: true, data: responseUser, message: 'User updated successfully' });
    } catch (error) {
        const errorMessage = error.message.replace(/\\|"/g, '');
        if (errorMessage.includes('E11000 duplicate key error')) {
            const fieldName = errorMessage.match(/index: (.+?) dup key/);
            const duplicateValue = errorMessage.match(/dup key: { (.+?) }/);

            return res.status(422).json({
            success:false,
            message: `User with the same name already exists.`,
            });
        }
        console.error('Error during user update:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const decodedToken = await getUserFromToken(req.headers.authorization);
        const id = decodedToken.user.id;
        const user = await User.findByIdAndDelete(id, req.body);
        if (!user) {
            res.status(404).json({
                success: true,
                message: "User not found"
            });
        }
        const responseUser = { ...user.toObject() };
        delete responseUser.password;
        res.status(200).json({
            success: true,
            data: responseUser,
            message: "Deletion successful: Your requested data has been removed.",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

exports.changePassword = async (req, res) => {
    try {
        const decodedToken = await getUserFromToken(req.headers.authorization);
        const userId = decodedToken.user.id;
        const user = await User.findById(userId);
        const { oldpassword, newpassword, confirmpassword } = req.body;
        // console.log(oldPassword,newPassword);
        if (newpassword !== confirmpassword){
           res.status(404).json({success:false, message:"Your confirm password doesn't match with new password"})
        }
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (!oldpassword || !user.password) {
            return res.status(400).json({ success: false, message: 'Both oldPassword and user.password are required' });
        }

        const isPasswordValid = await bcrypt.compare(oldpassword, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Incorrect old password' });
        }
        const hashedNewPassword = await bcrypt.hash(newpassword, 10);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { password: hashedNewPassword },
            { new: true, runValidators: true }
        );
        const responseUser = { ...updatedUser.toObject() };
        delete responseUser.password;

        res.status(200).json({ success: true, data: responseUser, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error during password change:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


async function sendResetPasswordEmail(email, resetToken) {
    const transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 587,
        auth: {
            user: "bec4c527638753",
            pass: "bf8fa20348bab2",
        },
    });
    console.log(resetToken);

    const mailOptions = {
        from: 'dipika.infynno@gmail.com', // Replace with your sender email address
        to: email,
        subject: 'Reset Your Password',
        text: `Click the following link to reset your password: http://localhost:3000/reset-password?token=${resetToken}`,
    };
    console.log(mailOptions);

    try {
        await transporter.sendMail(mailOptions);
        console.log('Reset password email sent successfully');
    } catch (error) {
        console.error('Error sending reset password email:', error);
    }
}

exports.forgotpassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        user.resetToken = resetToken;
        await user.save();
        await sendResetPasswordEmail(user.email, resetToken);
        return res.status(200).json({ success: true, message: 'Reset token sent successfully' });
    } catch (error) {
        console.error('Error during forgot password:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.resetPassword = async (req, res) => {
    try {
        const { token, newpassword, confirmpassword } = req.body;
        if (newpassword !== confirmpassword){
            res.status(404).json({success:false, message:"Your confirm password doesn't match with new password"})
         }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }


        const hashedNewPassword = await bcrypt.hash(newpassword, 10);
        user.password = hashedNewPassword;
        user.resetToken = null;
        await user.save();

        return res.status(200).json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        const errorMessage = error.message.replace(/\\|"/g, '');
        if (errorMessage.includes('jwt expired')) {
            return res.status(422).json({
            success:false,
            message: `Your session has been expried`,
            });
        }
        console.error('Error during password reset:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

async function sendResetPasswordEmail(email, resetToken) {
    const transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 587,
        auth: {
            user: "bec4c527638753",
            pass: "bf8fa20348bab2",
        },
    });

    const mailOptions = {
        from: 'dipika.infynno@gmail.com',
        to: email,
        subject: 'Reset Your Password',
        text: `Click the following link to reset your password: http://localhost:3000/reset-password?token=${resetToken}`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Reset password email sent successfully');
    } catch (error) {
        console.error('Error sending reset password email:', error);
    }
}
