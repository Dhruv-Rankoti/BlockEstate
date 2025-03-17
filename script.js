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
            document.getElementById("connectButton").textContent = "Connected";

            // Listen for account and network changes
            window.ethereum.on('accountsChanged', (accounts) => {
                account = accounts[0];
                console.log("Account changed to: ", account);
            });

            window.ethereum.on('chainChanged', (chainId) => {
                console.log("Chain changed to: ", chainId);
                // Handle network change here
            });

        } catch (error) {
            console.error("User denied account access:", error);
            alert("Please allow access to your MetaMask account.");
        }
    } else {
        alert("MetaMask is not installed!");
    }
}

// Register Property
async function registerProperty(event) {
    event.preventDefault();

    const price = document.getElementById("price").value;
    const location = document.getElementById("location").value;

    if (!price || !location) {
        alert("Please fill out all fields!");
        return;
    }

    try {
        const priceInWei = web3.utils.toWei(price, "ether");  // Convert price from ETH to Wei
        await contract.methods.registerProperty(
            priceInWei,
            location,
            true,  // For Sale (You can modify this based on your business logic)
            false, // Not for Rent (Modify as per the need)
            0,     // Rent Amount (Set accordingly)
            10,    // Number of Shares (Example value)
            web3.utils.toWei("0.1", "ether") // Share Price (Example value)
        ).send({ from: account });

        alert("Property Registered Successfully");
    } catch (error) {
        console.error(error);
        alert("An error occurred while registering the property.");
    }
}

// Function to show the student login form
document.getElementById('loginBtn').addEventListener('click', function() {
    document.getElementById('studentLogin').classList.remove('hidden');
    document.getElementById('propertyList').classList.add('hidden');
});

// Function to handle student login and show properties after verification
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission

    const studentID = document.getElementById('studentID').value;

    // Basic validation for student ID
    if (studentID.trim()) {
        alert('Login successful! Welcome, Student!');
        document.getElementById('studentLogin').classList.add('hidden');
        document.getElementById('propertyList').classList.remove('hidden');
    } else {
        alert('Please enter a valid Student ID.');
    }
});

// Function to simulate the smart contract process when user clicks "Sign Smart Contract"
function executeSmartContract(propertyName) {
    document.getElementById('propertyList').classList.add('hidden'); // Hide the property list
    document.getElementById('confirmation').classList.remove('hidden'); // Show the confirmation message

    // Simulate a delay to mimic the smart contract signing process
    setTimeout(function() {
        alert('Smart contract has been successfully executed! Property deal for ' + propertyName + ' is finalized.');
        // After the contract is signed, hide the confirmation and show properties again
        document.getElementById('confirmation').classList.add('hidden');
        document.getElementById('propertyList').classList.remove('hidden');
    }, 1500); // Simulate a short delay of 1.5 seconds
}

// Event Listener for the "Connect MetaMask" Button
document.getElementById("connectButton").addEventListener("click", connectMetaMask);

// Event Listener for the Property Registration Form
document.getElementById("registerForm").addEventListener("submit", registerProperty);
