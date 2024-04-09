const express = require('express')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
const bodyParser = require('body-parser');
const stripe = require('stripe')('sk_test_51OY48pCg3UF6njdMIGMex9SQFX49Hl36mb8yI20UV3M5HtIj3meONK8fF2YAaSp98DHENkED2aPt3JuI9Ypd7oXI00qqrB0fF5');
const port = 5000


app.use(cors())
app.use(bodyParser.json());


// mongodb==========================================================================================


const uri = "mongodb+srv://mashrafiahnam:IOwrG4DoOlIGCD3G@cluster0.yhuz2xd.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {


        // database define ---------------------------------------------------------------------
        const userCollection = client.db('Cookplato').collection('users');
        const pending = client.db('Cookplato').collection('pendingBooking');
        const request = client.db('Cookplato').collection('requestedBooking');
        const confirm = client.db('Cookplato').collection('confirmBooking');
        const message = client.db('Cookplato').collection('message');
        // ======================================================================================


        // get all users ---------------------------------------------------------------------------
        app.get("/getAllUsers", async (req, res) => {
            try {
                const users = await userCollection.find().toArray();
                res.status(200).json(users);
            } catch (error) {
                console.error("Error fetching users:", error);
                res.status(500).json({ error: "There was a server side error" });
            }
        });
        // =======================================================================

        // Get all cook's data --------------------------------------------------------
        app.get("/getAllUsers/cook", async (req, res) => {
            try {
                const cooks = await userCollection.find({ userRole: "cook" }).toArray();
                res.status(200).json(cooks);
            } catch (error) {
                console.error("Error fetching cooks:", error);
                res.status(500).json({ error: "There was a server side error" });
            }
        });
        // ============================================================================

        // Get approved cooks --------------------------------------------------------
        app.get("/getAllUsers/approvedCook", async (req, res) => {
            try {
                const approvedCooks = await userCollection.find({ status: "approved" }).toArray();
                res.status(200).json(approvedCooks);
            } catch (error) {
                console.error("Error fetching approved cooks:", error);
                res.status(500).json({ error: "There was a server side error" });
            }
        });
        // ============================================================================

        // Get pending cooks ---------------------------------------------------------
        app.get("/getAllUsers/pendingCook", async (req, res) => {
            try {
                const pendingCooks = await userCollection.find({ status: "pending" }).toArray();
                res.status(200).json(pendingCooks);
            } catch (error) {
                console.error("Error fetching pending cooks:", error);
                res.status(500).json({ error: "There was a server side error" });
            }
        });
        // ============================================================================

        // Get all dish items' information -------------------------------------------
        app.get("/getAllUsers/dishes", async (req, res) => {
            try {
                const allDishes = await userCollection.distinct('dishes', { dishes: { $exists: true, $ne: null } });
                res.status(200).json(allDishes);
            } catch (error) {
                console.error("Error fetching dishes:", error);
                res.status(500).json({ error: "There was a server side error" });
            }
        });
        // ============================================================================

        // Get user by email ---------------------------------------------------------
        app.get("/getAllUsers/email/:email", async (req, res) => {
            const userEmail = req.params.email;
            try {
                const user = await userCollection.findOne({ email: userEmail });
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }
                res.status(200).json({ message: "User found successfully", user: user });
            } catch (error) {
                console.error("Error fetching user:", error);
                res.status(500).json({ error: "There was a server side error" });
            }
        });
        // ============================================================================

        // Get user by ID ------------------------------------------------------------
        app.get("/getAllUsers/userId/:id", async (req, res) => {
            const userId = req.params.id;
            try {
                const user = await userCollection.findOne({ _id: new ObjectId(userId) });
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }
                res.status(200).json(user);
            } catch (error) {
                console.error("Error fetching user:", error);
                res.status(500).json({ error: "There was a server side error" });
            }
        });
        // ============================================================================

        // Create new user -----------------------------------------------------------
        app.post('/getAllUsers/submit', async (req, res) => {
            try {
                await userCollection.insertOne(req.body);
                res.status(200).send('User created successfully');
            } catch (error) {
                console.error('Error creating user:', error);
                res.status(500).send('Internal server error');
            }
        });
        // ============================================================================

        // Update user information ---------------------------------------------------
        app.put("/getAllUsers/:id", async (req, res) => {
            const userId = req.params.id;
            console.log(userId)
            try {
                const updatedUser = await userCollection.findOneAndUpdate({ _id: userId }, { $set: req.body }, { returnOriginal: false });
                if (!updatedUser.value) {
                    return res.status(404).json({ error: "User not found" });
                }
                res.status(200).json({ message: "User updated successfully", user: updatedUser.value });
            } catch (error) {
                console.error("Error updating user:", error);
                res.status(500).json({ error: "There was a server side error" });
            }
        });
        // ============================================================================

        // Update cook status --------------------------------------------------------
        app.put("/getAllUsers/update/:id", async (req, res) => {
            const userId = req.params.id;
            const updatedStatus = req.body.status;
        
            try {
                const updatedUser = await userCollection.findOneAndUpdate({ _id: new ObjectId(userId) }, { $set: { status: updatedStatus } }, { returnOriginal: false });
                if (!updatedUser.value) {
                    return res.status(404).json({ error: "User not found" });
                }
                res.status(200).json({ message: "User status updated successfully", user: updatedUser.value });
            } catch (error) {
                console.error("Error updating user status:", error);
                res.status(500).json({ error: "There was a server side error" });
            }
        });
        // ======================================================================================================







        // -----------------------MESSAGE---------------------------------
        // Get all messages that have been sent to Cook
        app.get("/getAllMessages", async (req, res) => {
            try {
                const messages = await message.find({}).toArray();
                res.status(200).json(messages);
            } catch (error) {
                console.log("Error while fetching the messages", error);
                res.status(500).json({ error: "There was a server side error" });
            }
        });

        // Upload message to the database
        app.post("/getAllMessages", async (req, res) => {
            const newMessage = req.body;
            console.log(newMessage);
            try {
                await message.insertOne(newMessage);
                res.status(201).json({ message: "Message added successfully", newMessage });
            } catch (error) {
                console.error("Error adding message:", error);
                res.status(500).json({ error: "There was a server side error" });
            }
        });
        // ================================================================









        // ---------------------------------------------------------------------------------------
        // Getting specific data of pending booking
        app.get("/pendingBooking/:email", async (req, res) => {
            try {
                const email = req.params.email;
                const pendingRequest = await pending.find({ email }).toArray();
                res.status(200).json(pendingRequest);
            } catch (error) {
                console.log("Error while getting specific data of pending request", error);
                res.status(500).json({ message: "There was a server side problem" });
            }
        });

        // Getting all the data of pending booking
        app.get("/pendingBooking", async (req, res) => {
            try {
                const pendingRequest = await pending.find().toArray();
                res.status(200).json(pendingRequest);
            } catch (error) {
                console.log("Error while getting all the data of pending request", error);
                res.status(500).json({ message: "There was a server side problem" });
            }
        });

        // Add a booking request
        app.post("/pendingBooking", async (req, res) => {
            try {
                const newInPendingRequest = req.body;
                await pending.insertOne(newInPendingRequest);
                res.status(201).json({ message: "New pending request", newPendingRequest: newInPendingRequest });
            } catch (error) {
                console.log("There was an error while adding a pending request", error);
                res.status(500).json({ message: "There was a server side error" });
            }
        });

        // Delete a booking request
        app.delete("/pendingBooking/:id", async (req, res) => {
            try {
                const pendingBookingId = req.params.id;
                const deletedRequest = await pending.findOneAndDelete({ _id: ObjectId(pendingBookingId) });
                if (deletedRequest.value) {
                    res.status(200).json({ message: "Pending booking deleted successfully", deletedRequest: deletedRequest.value });
                } else {
                    res.status(404).json({ error: "Pending item not found" });
                }
            } catch (error) {
                console.log("Error while deleting booking request", error);
                res.status(500).json({ error: "There was a server side error" });
            }
        });
        // =======================================================================================





        // ---------------------------------------------------------------------------------------
        // Getting all requested booking by email
        app.get("/confirmBooking/:email", async (req, res) => {
            try {
                const email = req.params.email;
                const confirmBooking = await  confirm.find({ email }).toArray();
                res.status(200).json(confirmBooking);
            } catch (error) {
                console.log("Error while getting confirmBooking:", error);
                res.status(500).json({ error: "There was a server side error" });
            }
        });

        // Getting all requested booking
        app.get("/confirmBooking", async (req, res) => {
            try {
                const confirmBooking = await confirm.find().toArray();
                res.status(200).json(confirmBooking);
            } catch (error) {
                console.log("Error while getting confirmBooking:", error);
                res.status(500).json({ error: "There was a server side error" });
            }
        });

        // Add a new booking request by user
        app.post("/confirmBooking", async (req, res) => {
            try {
                const newConfirmBooking = req.body;
                await confirm.insertOne(newConfirmBooking);
                res.status(201).json({ message: "Request for booking successful", confirmBooking: newConfirmBooking });
            } catch (error) {
                console.log("Error while adding booking request:", error);
                res.status(500).json({ error: "There was a server side error" });
            }
        });

        // Delete a booking request
        app.delete("/confirmBooking/:id", async (req, res) => {
            try {
                const requestedBookingId = req.params.id;
                const deletedRequest = await confirm.findOneAndDelete({ _id: ObjectId(requestedBookingId) });
                if (deletedRequest.value) {
                    res.status(200).json({ message: "Confirm booking deleted successfully", deletedRequest: deletedRequest.value });
                } else {
                    res.status(404).json({ error: "Booking not found" });
                }
            } catch (error) {
                console.log("Error while deleting booking:", error);
                res.status(500).json({ error: "There was a server side error" });
            }
        });
        // =======================================================================================





        // pending-------------------------------------------------
        // Getting specific data of pending booking
        app.get("/requestBooking/:email", async (req, res) => {
            try {
                const email = req.params.email;
                const pendingRequest = await request.find({ email }).toArray();
                res.status(200).json(pendingRequest);
            } catch (error) {
                console.log("Error while getting specific data of pending request", error);
                res.status(500).json({ message: "There was a server side problem" });
            }
        });

        // Getting all the data of pending booking
        app.get("/requestBooking", async (req, res) => {
            try {
                const pendingRequest = await request.find().toArray();
                res.status(200).json(pendingRequest);
            } catch (error) {
                console.log("Error while getting all the data of pending request", error);
                res.status(500).json({ message: "There was a server side problem" });
            }
        });

        // Add a booking request
        app.post("/requestBooking", async (req, res) => {
            try {
                const newInPendingRequest = req.body;
                await request.insertOne(newInPendingRequest);
                res.status(201).json({ message: "New pending request", newPendingRequest: newInPendingRequest });
            } catch (error) {
                console.log("There was an error while adding a pending request", error);
                res.status(500).json({ message: "There was a server side error" });
            }
        });

        // Delete a booking request
        app.delete("/requestBooking/:id", async (req, res) => {
            try {
                const pendingBookingId = req.params.id;
                const deletedRequest = await request.findOneAndDelete({ _id: ObjectId(pendingBookingId) });
                if (deletedRequest.value) {
                    res.status(200).json({ message: "Pending booking deleted successfully", deletedRequest: deletedRequest.value });
                } else {
                    res.status(404).json({ error: "Pending item not found" });
                }
            } catch (error) {
                console.log("Error while deleting booking request", error);
                res.status(500).json({ error: "There was a server side error" });
            }
        });

        // ===========================









        // Handle Stripe payment----------------------------------------
        app.post("/create-payment-intent", async (req, res) => {
            const { amount, currency, payment_method_types } = req.body;
            console.log(amount, currency, payment_method_types)
            try {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount,
                    currency,
                    payment_method_types,
                });
                res.status(200).json({ clientSecret: paymentIntent.client_secret });
            } catch (error) {
                console.error("Error creating payment intent:", error);
                res.status(500).json({ error: "Failed to create payment intent" });
            }
        });
        // =============================================================

        // Handle payout request from worker
        app.post("/request-payout", async (req, res) => {
            try {
                const { amount } = req.body;

                // Create a payout to the worker's bank account
                const payout = await stripe.transfers.create({
                    amount,
                    currency: 'usd', // Adjust currency as necessary
                    destination: 69207711, // Replace with Payoneer account ID
                });

                res.status(200).json({ success: true, payout });
            } catch (error) {
                console.error("Error creating payout:", error);
                res.status(500).json({ error: "Failed to create payout" });
            }
        });

        app.post('/charge', async (req, res) => {
            try {
                const paymentMethodId = req.body.paymentMethodId;

                // Create a Payment Intent with a return URL
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: 1000, // amount in cents
                    currency: 'usd',
                    payment_method: paymentMethodId,
                    confirm: true,
                    return_url: 'https://yourwebsite.com/success', // Your success page URL
                });

                res.status(200).json({ clientSecret: paymentIntent.client_secret });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'An error occurred while processing your payment.' });
            }
        });


        // ===========================================================================================================
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})