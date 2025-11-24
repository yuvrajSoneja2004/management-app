const User = require('./user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate Access Token
const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '15m'
    });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '7d'
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            username,
            email,
            password
        });

        if (user) {
            const accessToken = generateAccessToken(user._id);
            const refreshToken = generateRefreshToken(user._id);

            // Save refresh token to DB
            user.refreshToken = refreshToken;
            await user.save();

            // Send refresh token in HTTP-only cookie
            res.cookie('jwt', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                accessToken
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            const accessToken = generateAccessToken(user._id);
            const refreshToken = generateRefreshToken(user._id);

            user.refreshToken = refreshToken;
            await user.save();

            res.cookie('jwt', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                accessToken
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
exports.logoutUser = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.jwt;
        if (!refreshToken) return res.sendStatus(204);

        // Is refresh token in db?
        const user = await User.findOne({ refreshToken });
        if (user) {
            user.refreshToken = '';
            await user.save();
        }

        res.clearCookie('jwt', {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production'
        });
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Refresh access token
// @route   GET /api/auth/refresh
// @access  Public
exports.refresh = async (req, res, next) => {
    try {
        const cookies = req.cookies;
        if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' });

        const refreshToken = cookies.jwt;
        const user = await User.findOne({ refreshToken });

        if (!user) return res.status(403).json({ message: 'Forbidden' });

        jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET,
            (err, decoded) => {
                if (err || user._id.toString() !== decoded.id) return res.status(403).json({ message: 'Forbidden' });

                const accessToken = generateAccessToken(user._id);
                res.json({ accessToken });
            }
        );
    } catch (error) {
        next(error);
    }
};
