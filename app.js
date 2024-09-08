// Wait until the DOM is fully loaded before running the script
document.addEventListener("DOMContentLoaded", function () {

    // Helper function to validate the password complexity
    function validatePassword(password) {
        const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])/;  // At least one uppercase letter and one special character
        return regex.test(password);
    }

    // Handle registration form submission
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault(); // Prevent default form submission

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Validate password
            if (!validatePassword(password)) {
                document.getElementById('error-message').innerText = "Password must contain at least one uppercase letter and one special character.";
                return;
            }

            // Send a POST request to register a new user
            const response = await fetch('http://localhost:3002/registerUser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            const result = await response.json();

            // Show feedback to the user
            if (response.status === 201) {
                document.getElementById('success-message').innerText = result.msg;
                document.getElementById('error-message').innerText = '';

                // Redirect to login page after successful registration
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1500);
            } else {
                document.getElementById('error-message').innerText = result.msg;
                document.getElementById('success-message').innerText = '';
            }
        });
    }

    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault(); // Prevent default form submission

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Send a POST request to log in the user
            const response = await fetch('http://localhost:3002/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            // Show feedback to the user
            if (response.status === 200) {
                document.getElementById('success-message').innerText = result.msg;
                document.getElementById('error-message').innerText = '';

                // Store the JWT token in localStorage
                localStorage.setItem('token', result.token);

                // Redirect to homepage or products page
                setTimeout(() => {
                    window.location.href = "homepage.html";
                }, 1000);
            } else {
                document.getElementById('error-message').innerText = result.msg;
                document.getElementById('success-message').innerText = '';
            }
        });
    }

    // Function to add item to the cart
    function addToCart(id, name, price) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItem = cart.find(item => item.id === id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id, name, price, quantity: 1 });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    // Handle "Add to Cart" button clicks on homepage
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            const name = this.getAttribute('data-name');
            const price = parseFloat(this.getAttribute('data-price'));

            addToCart(id, name, price);
        });
    });

    // Function to display cart items
    function displayCart() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const cartSection = document.getElementById('cart');
        cartSection.innerHTML = '';

        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.classList.add('cart-item');
            cartItem.innerHTML = `
                <h2>${item.name}</h2>
                <p>$${item.price.toFixed(2)}</p>
                <p>Quantity: <span class="quantity">${item.quantity}</span></p>
                <button class="remove" data-id="${item.id}">Remove</button>
                <button class="decrease" data-id="${item.id}">-</button>
                <button class="increase" data-id="${item.id}">+</button>
                <p class="coupon-price">After Coupon: $${item.price.toFixed(2)}</p>
            `;
            cartSection.appendChild(cartItem);
        });

        updateTotal();
    }

    // Function to update the total price
    function updateTotal() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const totalElement = document.getElementById('total-price');
        const total = cart.reduce((sum, item) => {
            const discount = getCouponDiscount(item.price);
            return sum + (item.price - discount) * item.quantity;
        }, 0);
        totalElement.innerText = `$${total.toFixed(2)}`;
    }

    // Function to get the coupon discount
    async function getCouponDiscount(price) {
        const response = await fetch('http://localhost:3002/getMaxCoupon');
        const data = await response.json();

        if (response.status === 200) {
            const maxCoupon = data.maxCoupon;
            return Math.min(maxCoupon.discount, price);
        } else {
            return 0;
        }
    }

    // Handle cart page functionality
    if (document.getElementById('cart')) {
        displayCart();

        // Handle Remove button clicks
        document.getElementById('cart').addEventListener('click', function (e) {
            if (e.target.classList.contains('remove')) {
                const id = e.target.getAttribute('data-id');
                let cart = JSON.parse(localStorage.getItem('cart'));
                cart = cart.filter(item => item.id !== id);
                localStorage.setItem('cart', JSON.stringify(cart));
                displayCart();
            } else if (e.target.classList.contains('decrease')) {
                const id = e.target.getAttribute('data-id');
                let cart = JSON.parse(localStorage.getItem('cart'));
                const item = cart.find(item => item.id === id);
                if (item.quantity > 1) {
                    item.quantity -= 1;
                } else {
                    cart = cart.filter(item => item.id !== id);
                }
                localStorage.setItem('cart', JSON.stringify(cart));
                displayCart();
            } else if (e.target.classList.contains('increase')) {
                const id = e.target.getAttribute('data-id');
                let cart = JSON.parse(localStorage.getItem('cart'));
                const item = cart.find(item => item.id === id);
                if (item) {
                    item.quantity += 1;
                }
                localStorage.setItem('cart', JSON.stringify(cart));
                displayCart();
            }
        });
    }
    document.addEventListener('DOMContentLoaded', () => {
        fetchCoupons();
    });
    
    function addToCart(productId) {
        // Example implementation for adding to cart
        console.log(`Product ${productId} added to cart.`);
        // You can send an API request to your backend to add the item to the cart
    }
    
    function giftCoupon(productId) {
        // Example implementation for gifting a coupon
        console.log(`Gifting coupon for Product ${productId}.`);
        // You can send an API request to your backend to handle gifting the coupon
    }
    
    function fetchCoupons() {
        // Fetch the coupon data from the backend (you can replace this with your actual API endpoint)
        fetch('/api/coupons')
            .then(response => response.json())
            .then(coupons => {
                // Apply coupons to products
                console.log('Coupons fetched:', coupons);
            })
            .catch(error => {
                console.error('Error fetching coupons:', error);
            });
    }
    
});
