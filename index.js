const express = require('express');
const app = express();
const port = 3002;
const path = require('path'); 
const fs = require('fs');
app.use(express.static('public'));

app.use(express.json());

const COUPON_FILE_PATH = path.join(__dirname, 'coupon.json');
const CART_FILE_PATH = path.join(__dirname, 'cart.json');

const { readFile, writeFile } = require('./File');  // Custom file for handling JSON operations
const users = './Users.json';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

// Helper function to validate password
function validatePassword(password) {
    const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])/;  // Regex for at least one uppercase and one special character
    return regex.test(password);
}

// Helper function to read coupon data from the file
function readCoupons() {
    try {
        const data = fs.readFileSync(COUPON_FILE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Helper function to write coupon data to the file
function writeCoupons(coupons) {
    fs.writeFileSync(COUPON_FILE_PATH, JSON.stringify(coupons, null, 2), 'utf-8');
}

// Helper function to read cart data
function readCart() {
    try {
        const data = fs.readFileSync(CART_FILE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Helper function to write cart data
function writeCart(cart) {
    fs.writeFileSync(CART_FILE_PATH, JSON.stringify(cart, null, 2), 'utf-8');
}

// Use environment variables for sensitive data
require('dotenv').config();

const secret_key = process.env.SECRET_KEY || "default_secret_key"; // Store this in an .env file

app.use(cors());  // To allow cross-origin requests (important for frontend-backend communication)

// Middleware to verify token
// Middleware to verify token
function verifyToken(req, res, next) {
    let token = req.headers.authorization; // Get the token from the Authorization header
    console.log(token); // Log the token for debugging
    
    if (!token) {
        return res.status(401).json({ msg: "Token Required" });
    }

    // Remove 'Bearer ' prefix if it exists
    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length); // Remove 'Bearer ' (7 characters)
    }

    try {
        req.user = jwt.verify(token, secret_key); // Verify the token
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.log(error); // Log the error for debugging
        return res.status(401).json({ msg: "Invalid Token" });
    }
}


// Register User
app.post("/registerUser", (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if the password meets the required criteria
        if (!validatePassword(password)) {
            return res.status(400).json({ msg: "Password must contain at least one uppercase letter and one special character." });
        }

        const users_data = readFile(users);
        let user_id = users_data.length === 0 ? 1 : users_data[users_data.length - 1].id + 1;

        const existingUser = users_data.find(user => user.email === email);
        if (existingUser) {
            return res.status(400).json({ msg: "Email Already Exists" });
        }

        const hashedPassword = bcrypt.hashSync(password, 8);
        const newUser = {
            id: user_id,
            name,
            email,
            password: hashedPassword
        };

        users_data.push(newUser);
        writeFile(users, users_data);

        return res.status(201).json({ msg: "User Registered Successfully" });
    } catch (error) {
        return res.status(500).json({ msg: "An error occurred while registering the user", error });
    }
});

// Login User
app.post("/login", (req, res) => {
    try {
        const { email, password } = req.body;
        const users_data = readFile(users);
        const user = users_data.find(u => u.email === email);

        if (!user) {
            return res.status(400).json({ msg: "Incorrect Email" });
        }

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) {
            return res.status(400).json({ msg: "Incorrect Password" });
        }

        const token = jwt.sign({ user_id: user.id, name: user.name }, secret_key, { expiresIn: '2h' });  // Token expires in 2 hours
        return res.status(200).json({ msg: "Login Successful", token });
    } catch (error) {
        return res.status(500).json({ msg: "An error occurred during login", error });
    }
});

// Logout User
app.post("/logout", verifyToken, (req, res) => {
    // For stateless JWT-based sessions, logout can be handled client-side by removing the token.
    return res.status(200).json({ msg: "Logout Successful" });
});

// Endpoint to create a coupon
app.post('/createCoupon', (req, res) => {
    const { code, discount } = req.body;

    if (!code || !discount) {
        return res.status(400).json({ msg: "Coupon code and discount are required" });
    }

    const coupons = readCoupons();
    coupons.push({ code, discount });

    writeCoupons(coupons);
    res.status(201).json({ msg: 'Coupon created successfully', coupons });
});

// Endpoint to get the max discount coupon
app.get('/getMaxCoupon', (req, res) => {
    const coupons = readCoupons();

    if (coupons.length === 0) {
        return res.status(404).json({ msg: 'No coupons available' });
    }

    // Find the maximum discount coupon
    const maxCoupon = coupons.reduce((max, coupon) => {
        return coupon.discount > max.discount ? coupon : max;
    });

    res.status(200).json({ maxCoupon });
});

// Endpoint to add an item to the cart
app.post('/addToCart', verifyToken, (req, res) => {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
        return res.status(400).json({ msg: "Product ID and quantity are required" });
    }

    const cart = readCart();
    const existingItem = cart.find(item => item.productId === productId && item.userId === req.user.user_id);

    if (existingItem) {
        existingItem.quantity += quantity;  // Update quantity if item exists in cart
    } else {
        cart.push({ userId: req.user.user_id, productId, quantity });
    }

    writeCart(cart);
    res.status(201).json({ msg: 'Item added to cart successfully', cart });
});

// Endpoint to get items in the cart for the logged-in user
app.get('/cart', verifyToken, (req, res) => {
    const cart = readCart();
    const userCart = cart.filter(item => item.userId === req.user.user_id);

    if (userCart.length === 0) {
        return res.status(404).json({ msg: 'No items in the cart' });
    }

    res.status(200).json({ cart: userCart });
});
// Helper function to calculate total cart value for a user
function calculateCartTotal(userId) {
    const cart = readCart();
    const userCart = cart.filter(item => item.userId === userId);

    // Calculate the total price of the items in the cart (assuming each product has a price property)
    let total = 0;
    userCart.forEach(item => {
        const productPrice = getProductPrice(item.productId); // Assume a function to get the price of a product
        total += productPrice * item.quantity;
    });

    return total;
}

// Function to get product price (this could be from a product file or database)
function getProductPrice(productId) {
    // This is a placeholder for product data retrieval.
    // In a real application, you would fetch this from a product database or a file.
    const products = [
        { id: 1, price: 100 },
        { id: 2, price: 200 },
        { id: 3, price: 300 }
    ];
    
    const product = products.find(p => p.id === productId);
    return product ? product.price : 0;
}

// Endpoint to apply a coupon to the cart
app.post('/applyCoupon', verifyToken, (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ msg: "Coupon code is required" });
    }

    const coupons = readCoupons();
    const coupon = coupons.find(c => c.code === code);

    if (!coupon) {
        return res.status(404).json({ msg: 'Coupon not found' });
    }

    // Calculate total cart value for the logged-in user
    const cartTotal = calculateCartTotal(req.user.user_id);

    // Apply the discount
    const discountValue = (cartTotal * coupon.discount) / 100;
    const discountedTotal = cartTotal - discountValue;

    res.status(200).json({
        msg: "Coupon applied successfully",
        originalTotal: cartTotal,
        discount: coupon.discount,
        discountValue: discountValue,
        discountedTotal: discountedTotal
    });
});
app.listen(port, () => {
    console.log(`FlavorJet Auth Service running on port ${port}`);
});
