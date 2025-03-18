let web3;
let contract;
let account;

// ABI and Contract Address
const abi = [ /* ABI from your compiled smart contract */ ];
const contractAddress = "0xDcfA25174a46b06081847b6359198498ba9CCa20";  // Replace with your contract's address

// Connect to MetaMask
async function connectMetaMask() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            // Request access to the user's MetaMask account
            await window.ethereum.request({ method: 'eth_requestAccounts' });

            // Get the first account
            account = (await web3.eth.getAccounts())[0];
            console.log("Connected Account: ", account);

            // Initialize the contract
            contract = new web3.eth.Contract(abi, contractAddress);

            // Update UI to show connection status
            const connectButton = document.getElementById("connectButton");
            connectButton.textContent = "Connected";
            connectButton.classList.add("connected");
            
            // Show wallet address
            const truncatedAddress = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
            connectButton.textContent = `Connected: ${truncatedAddress}`;

            // Listen for account and network changes
            window.ethereum.on('accountsChanged', (accounts) => {
                account = accounts[0];
                console.log("Account changed to: ", account);
                
                if (accounts.length === 0) {
                    // User disconnected all accounts
                    connectButton.textContent = "Connect MetaMask";
                    connectButton.classList.remove("connected");
                } else {
                    // Update with new account
                    const truncatedNewAddress = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
                    connectButton.textContent = `Connected: ${truncatedNewAddress}`;
                }
            });

            window.ethereum.on('chainChanged', (chainId) => {
                console.log("Chain changed to: ", chainId);
                // Handle network change here
                window.location.reload(); // Recommended by MetaMask docs
            });

        } catch (error) {
            console.error("User denied account access:", error);
            alert("Please allow access to your MetaMask account.");
        }
    } else {
        alert("MetaMask extension is not installed! Please install it to use this application.");
    }
}

// Register Property
async function registerProperty(event) {
    event.preventDefault();

    if (!account) {
        alert("Please connect your MetaMask wallet first!");
        return;
    }

    const propertyTitle = document.getElementById("propertyTitle").value;
    const price = document.getElementById("price").value;
    const location = document.getElementById("location").value;
    const studentDiscount = document.getElementById("studentDiscount").value || "0";
    const description = document.getElementById("description").value || "";

    if (!propertyTitle || !price || !location) {
        alert("Please fill out all required fields!");
        return;
    }

    try {
        const priceInWei = web3.utils.toWei(price, "ether");  // Convert price from ETH to Wei
        
        // Show loading state
        const submitButton = event.target.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = "Registering...";
        submitButton.disabled = true;
        
        await contract.methods.registerProperty(
            propertyTitle,
            priceInWei,
            location,
            true,  // For Sale (You can modify this based on your business logic)
            false, // Not for Rent (Modify as per the need)
            studentDiscount,
            description,
            10,    // Number of Shares (Example value)
            web3.utils.toWei("0.1", "ether") // Share Price (Example value)
        ).send({ from: account });

        alert("Property Registered Successfully!");
        
        // Reset form and hide modal
        document.getElementById("registerForm").reset();
        document.getElementById("propertyRegistration").classList.add("hidden");
        
        // Restore button state
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
        
    } catch (error) {
        console.error(error);
        alert("An error occurred while registering the property.");
        
        // Restore button state on error
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.textContent = "Register Property";
        submitButton.disabled = false;
    }
}

// Function to execute smart contract for property rental/purchase
async function executeSmartContract(propertyName) {
    if (!account) {
        alert("Please connect your MetaMask wallet first!");
        return;
    }
    
    // Generate a fake transaction hash for demo purposes
    const fakeHash = '0x' + Array(64).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)).join('');
    
    document.getElementById('txHash').textContent = `${fakeHash.substring(0, 10)}...${fakeHash.substring(fakeHash.length - 8)}`;
    document.getElementById('propertyList').classList.add('hidden');
    document.getElementById('confirmation').classList.remove('hidden');
    
    // In a real application, you would call your smart contract method here
    // For example:
    // try {
    //     const result = await contract.methods.rentProperty(propertyId).send({ from: account, value: priceInWei });
    //     document.getElementById('txHash').textContent = result.transactionHash;
    // } catch (error) {
    //     console.error(error);
    //     alert("Transaction failed. Please try again.");
    // }
}

// DOM Event Listeners

// Login Button
document.getElementById('loginBtn').addEventListener('click', function() {
    document.getElementById('studentLogin').classList.remove('hidden');
});

// Login Form Submit
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const studentID = document.getElementById('studentID').value;
    const password = document.getElementById('password').value;

    // Basic validation
    if (studentID.trim() && password.trim()) {
        alert('Login successful! Welcome, Student!');
        document.getElementById('studentLogin').classList.add('hidden');
        document.getElementById('propertyList').classList.remove('hidden');
    } else {
        alert('Please enter valid credentials.');
    }
});

// Explore Properties Button
document.getElementById('exploreBtn').addEventListener('click', function() {
    document.getElementById('propertyList').classList.remove('hidden');
    
    // Scroll to property listings
    document.getElementById('propertyList').scrollIntoView({ behavior: 'smooth' });
});

// Register Property Button
document.getElementById('registerPropertyBtn').addEventListener('click', function() {
    if (!account) {
        alert("Please connect your MetaMask wallet first to register a property!");
        return;
    }
    document.getElementById('propertyRegistration').classList.remove('hidden');
});

// Close Transaction Confirmation
document.getElementById('closeTxBtn').addEventListener('click', function() {
    document.getElementById('confirmation').classList.add('hidden');
    document.getElementById('propertyList').classList.remove('hidden');
});

// Connect MetaMask Button
document.getElementById("connectButton").addEventListener("click", connectMetaMask);

// Property Registration Form
document.getElementById("registerForm").addEventListener("submit", registerProperty);

// Close Buttons for Modals
document.querySelectorAll('.close-button').forEach(button => {
    button.addEventListener('click', function() {
        this.closest('.modal').classList.add('hidden');
    });
});

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    document.querySelectorAll('.modal').forEach(modal => {
        if (event.target === modal) {
            modal.classList.add('hidden');
        }
    });
});

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Check if MetaMask is already connected
    if (window.ethereum && window.ethereum.selectedAddress) {
        connectMetaMask();
    }
});
