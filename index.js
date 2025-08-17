
const dotenv = require('dotenv');


const express = require('express');
const cors = require('cors');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

dotenv.config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8')
const serviceAccount = JSON.parse(decoded);



// MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nrfuo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    // MongoDB Collections
    const database = client.db('Fitness_tracker_user');
    const usersCollection = database.collection('users');
    const trainerCollection = database.collection('become-a-trainer');
    const acceptedTrainersCollection = database.collection('trainers');
    const newsletterCollection = database.collection('newsletter');
    const classesCollection = database.collection('classes');
    const rejectedTrainersCollection = database.collection('trainer-rejections');
    const paymentsCollection = database.collection('payments');
    const reviewsCollection = database.collection('reviews');
    const slotsCollection = database.collection('trainer-slots');



    // ---------- Basic Routes ----------
    app.get('/', (req, res) => res.send('Server is running!'));

    // ---------- Users ----------
    app.post('/users', async (req, res) => {
      const user = req.body;
      user.email = user.email.toLowerCase();
      const existingUser = await usersCollection.findOne({ email: user.email });
      if (existingUser) return res.status(409).send({ message: 'User already exists' });

      user.role = 'member';
      user.createdAt = new Date();
      user.active = true;

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get('/users', async (req, res) => {
      const email = req.query.email?.toLowerCase();
      if (!email) return res.status(400).send({ message: 'Email is required' });

      const user = await usersCollection.findOne({ email });
      if (!user) return res.status(404).send({ message: 'User not found' });

      res.send(user);
    });

    app.put('/users/:email', async (req, res) => {
      const email = req.params.email.toLowerCase();
      const { displayName, photoURL } = req.body;

      if (!displayName) return res.status(400).send({ message: 'Name is required' });

      const updateDoc = {
        $set: { displayName, photoURL, updatedAt: new Date() },
      };

      const result = await usersCollection.updateOne({ email }, updateDoc);
      if (result.matchedCount === 0) return res.status(404).send({ message: 'User not found' });

      res.send({ message: 'Profile updated successfully' });
    });

    // ---------- Trainer Applications ----------
    app.post('/become-a-trainer', async (req, res) => {
      const application = req.body;
      application.status = 'pending';
      application.appliedAt = new Date();
      const result = await trainerCollection.insertOne(application);
      res.status(201).send(result);
    });

    app.get('/become-a-trainer', async (req, res) => {
      const applications = await trainerCollection.find().toArray();
      res.send(applications);
    });

    app.post('/become-a-trainer/confirm', async (req, res) => {
  const { email } = req.body;

  const application = await trainerCollection.findOne({ email });
  if (!application) return res.status(404).send({ message: 'Trainer application not found' });

  await acceptedTrainersCollection.insertOne({
    ...application,
    status: 'accepted',
    acceptedAt: new Date(),
  });

  const updateUser = await usersCollection.updateOne(
    { email },
    { $set: { role: 'trainer' } } // ✅ This line updates the role
  );

  const deletePending = await trainerCollection.deleteOne({ email });

  res.send({
    userUpdated: updateUser.modifiedCount,
    deletedFromPending: deletePending.deletedCount,
  });
});


    app.post('/become-a-trainer/reject', async (req, res) => {
      const { email, feedback } = req.body;
      const rejectedTrainer = await trainerCollection.findOne({ email });
      if (!rejectedTrainer) {
        return res.status(404).send({ message: 'Trainer application not found' });
      }

      const rejectionEntry = {
        ...rejectedTrainer,
        feedback,
        rejectedAt: new Date(),
      };

      await rejectedTrainersCollection.insertOne(rejectionEntry);
      const result = await trainerCollection.deleteOne({ email });

      res.send({ deleted: result.deletedCount, rejected: true });
    });

    app.get('/rejected-applications', async (req, res) => {
  try {
    const rejections = await rejectedTrainersCollection
      .find()
      .sort({ rejectedAt: -1 })
      .toArray();
    res.send(rejections);
  } catch (err) {
    console.error('Failed to fetch rejected applications:', err);
    res.status(500).send({ message: 'Internal server error' });
  }
});


    // ---------- Trainers ----------
    app.get('/trainers/:id', async (req, res) => {
      try {
        const trainerId = req.params.id;
        const trainer = await acceptedTrainersCollection.findOne({ _id: new ObjectId(trainerId) });
        if (!trainer) return res.status(404).send({ message: 'Trainer not found' });
        res.send(trainer);
      } catch (err) {
        console.error('Error fetching trainer:', err);
        res.status(500).send({ message: 'Internal server error' });
      }
    });

    app.get('/trainers', async (req, res) => {
      const trainers = await acceptedTrainersCollection.find().toArray();
      res.send(trainers);
    });

    app.patch('/remove-trainer', async (req, res) => {
      const { email } = req.body;
      if (!email) return res.status(400).send({ message: 'Email is required' });

      const updateUser = await usersCollection.updateOne(
        { email },
        { $set: { role: 'member' } }
      );
      const deleteFromTrainers = await acceptedTrainersCollection.deleteOne({ email });

      res.send({
        modified: updateUser.modifiedCount,
        deleted: deleteFromTrainers.deletedCount,
      });
    });

    // ---------- Newsletter ----------
    app.post('/newsletter', async (req, res) => {
      const { name, email } = req.body;
      if (!name || !email) {
        return res.status(400).send({ message: 'Name and Email are required.' });
      }

      const exists = await newsletterCollection.findOne({ email: email.toLowerCase() });
      if (exists) {
        return res.status(409).send({ message: 'You are already subscribed!' });
      }

      const result = await newsletterCollection.insertOne({
        name,
        email: email.toLowerCase(),
        subscribedAt: new Date(),
      });

      res.status(201).send({ message: 'Subscribed successfully', id: result.insertedId });
    });

    app.get('/newsletter', async (req, res) => {
      const subscribers = await newsletterCollection
        .find({})
        .sort({ subscribedAt: -1 })
        .toArray();
      res.send(subscribers);
    });

    // Get all applications with status
    app.get('/trainer-application-status', async (req, res) => {
      try {
        const pending = await trainerCollection.find().toArray();
        const rejected = await rejectedTrainersCollection.find().toArray();
        const approved = await usersCollection.find({ role: 'trainer' }).toArray();


        const pendingWithStatus = pending.map(p => ({
          fullName: p.fullName || p.name || 'N/A',
          email: p.email,
          status: 'Pending',
        }));

        const rejectedWithStatus = rejected.map(r => ({
          fullName: r.fullName || r.name || 'N/A',
          email: r.email,
          status: 'Rejected',
          feedback: r.feedback || '',
        }));

        const approvedWithStatus = approved.map(a => ({
          fullName: a.displayName || a.fullName || a.name || 'N/A',
          email: a.email,
          status: 'Approved',
        }));

        const allApplications = [...pendingWithStatus, ...rejectedWithStatus, ...approvedWithStatus];
        res.send(allApplications);
      } catch (err) {
        console.error('Error fetching application status:', err);
        res.status(500).send({ message: 'Internal Server Error' });
      }
    });

    // ---------- Classes ----------
    app.post('/classes', async (req, res) => {
      const classInfo = req.body;

      if (!classInfo.name || !classInfo.image || !classInfo.details) {
        return res.status(400).send({ message: 'Missing required fields' });
      }

      classInfo.createdAt = new Date();

      const result = await classesCollection.insertOne(classInfo);
      res.status(201).send({ message: 'Class added successfully', id: result.insertedId });
    });

    app.get('/classes', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 6;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';

  const searchQuery = search
    ? { name: { $regex: new RegExp(search, 'i') } } // case-insensitive search
    : {};

  const total = await classesCollection.countDocuments(searchQuery);
  const classes = await classesCollection
    .find(searchQuery)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  const enrichedClasses = await Promise.all(
    classes.map(async cls => {
      const relatedTrainers = await acceptedTrainersCollection
        .find({ skills: { $regex: new RegExp(cls.name, 'i') } })
        .limit(5)
        .project({ fullName: 1, profileImage: 1, _id: 1 })
        .toArray();

      return { ...cls, relatedTrainers };
    })
  );

  res.send({
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    classes: enrichedClasses,
  });
});

    // Create payment intent
    app.post('/create-payment-intent', async (req, res) => {
    const { price, trainerId } = req.body;
    
    // Validate input
    if (!price || isNaN(price)) {
        return res.status(400).json({ error: 'Valid price is required' });
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(price * 100), // Convert to cents
        currency: 'usd',
        payment_method_types: ['card'],
        metadata: { trainerId } // Store trainer ID in metadata
        });

        res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
        });
    } catch (err) {
        console.error('Stripe error:', err);
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
    });

    // Save payment record
    app.post('/payments', async (req, res) => {
    const paymentData = req.body;
    const result = await database.collection('payments').insertOne(paymentData);

    // Optionally: increase booking count in a class
    await classesCollection.updateOne(
        { name: paymentData.package }, // or another identifier
        { $inc: { bookings: 1 } }
    );

    res.send(result);
    });
    app.get('/admin/balance', async (req, res) => {
  try {
    const totalBalanceResult = await paymentsCollection.aggregate([
      { $group: { _id: null, total: { $sum: "$price" } } }
    ]).toArray();

    const totalBalance = totalBalanceResult[0]?.total || 0;

    const recentPayments = await paymentsCollection
      .find({})
      .sort({ paidAt: -1 })
      .limit(6)
      .toArray();

    const totalSubscribers = await newsletterCollection.countDocuments() || 0;
    const totalPaidMembers = await usersCollection.countDocuments({ role: 'member' }) || 0;

    console.log("BALANCE DEBUG:", {
      totalBalance,
      totalSubscribers,
      totalPaidMembers,
      recentPaymentsCount: recentPayments.length
    });

    res.send({
      totalBalance,
      recentPayments,
      totalSubscribers,
      totalPaidMembers
    });
  } catch (error) {
    console.error('Error in /admin/balance:', error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});
// Save a new forum post
app.post('/forum-post', async (req, res) => {
  const post = req.body;

  if (!post.title || !post.content || !post.authorEmail) {
    return res.status(400).send({ message: 'Missing required fields' });
  }

  post.createdAt = new Date();

  const result = await database.collection('forumPosts').insertOne(post);
  res.status(201).send({ message: 'Post created', id: result.insertedId });
});

app.get('/forum-posts', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 6;
  const skip = (page - 1) * limit;

  const posts = await database.collection('forumPosts')
    .find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  // Attach author roles
  const emails = posts.map(p => p.authorEmail);
  const users = await usersCollection.find({ email: { $in: emails } }).toArray();
  const userMap = users.reduce((map, u) => {
    map[u.email] = u.role;
    return map;
  }, {});

  const postsWithRoles = posts.map(p => ({
    ...p,
    role: userMap[p.authorEmail] || 'member',
    upvoteCount: p.upvotes?.length || 0,
    downvoteCount: p.downvotes?.length || 0
  }));

  const total = await database.collection('forumPosts').countDocuments();
  res.send({
    posts: postsWithRoles,
    totalPages: Math.ceil(total / limit),
    currentPage: page
  });
});
app.post('/forum-vote', async (req, res) => {
  const { postId, email, type } = req.body;

  if (!postId || !email || !['upvote', 'downvote'].includes(type)) {
    return res.status(400).send({ message: 'Invalid request' });
  }

  const post = await database.collection('forumPosts').findOne({ _id: new ObjectId(postId) });
  if (!post) return res.status(404).send({ message: 'Post not found' });

  const update = {};

  if (type === 'upvote') {
    update.$addToSet = { upvotes: email };
    update.$pull = { downvotes: email };
  } else {
    update.$addToSet = { downvotes: email };
    update.$pull = { upvotes: email };
  }

  await database.collection('forumPosts').updateOne({ _id: new ObjectId(postId) }, update);
  res.send({ message: 'Vote recorded' });
});
app.get('/home-forum-posts', async (req, res) => {
  try {
    const limit = 6;

    const posts = await database.collection('forumPosts')
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Fetch all unique emails
    const emails = posts.map(p => p.authorEmail);
    const users = await usersCollection.find({ email: { $in: emails } }).toArray();

    const userMap = users.reduce((map, user) => {
      map[user.email] = {
        role: user.role || 'member',
        displayName: user.displayName || user.name || 'Anonymous'
      };
      return map;
    }, {});

    const enrichedPosts = posts.map(post => ({
      _id: post._id,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      authorEmail: post.authorEmail,
      authorName: userMap[post.authorEmail]?.displayName || 'Anonymous',
      role: userMap[post.authorEmail]?.role || 'member',
      upvoteCount: post.upvotes?.length || 0,
      downvoteCount: post.downvotes?.length || 0
    }));

    res.send(enrichedPosts);
  } catch (error) {
    console.error('Error fetching home forum posts:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});
app.get('/forum-post/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const post = await database.collection('forumPosts').findOne({ _id: new ObjectId(id) });
    if (!post) return res.status(404).send({ message: 'Post not found' });

    const author = await usersCollection.findOne({ email: post.authorEmail });
    const role = author?.role || 'member';
    const authorName = author?.displayName || author?.name || 'Anonymous';

    res.send({
      ...post,
      role,
      authorName,
      upvoteCount: post.upvotes?.length || 0,
      downvoteCount: post.downvotes?.length || 0
    });
  } catch (err) {
    console.error('Error fetching single forum post:', err);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

// Get booked trainer by user email
// Fetch booked trainer for a user by email and from payment and trainer collection

// Get payment/booking details by ID
// Get payment/booking details by ID
app.get('/payments/:id', async (req, res) => {
  try {
    // First validate the ID
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).send({ message: 'Invalid payment ID format' });
    }

    const payment = await paymentsCollection.findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (!payment) {
      return res.status(404).send({ message: 'Booking not found' });
    }
    
    res.send(payment);
  } catch (err) {
    console.error('Error fetching payment:', err);
    res.status(500).send({ message: 'Internal server error' });
  }
});


// Get trainer by ID
app.get('/trainers/:id', async (req, res) => {
  try {
    const trainer = await acceptedTrainersCollection.findOne({
      _id: new ObjectId(req.params.id)
    });
    
    if (!trainer) {
      return res.status(404).send({ message: 'Trainer not found' });
    }
    
    res.send(trainer);
  } catch (err) {
    console.error('Error fetching trainer:', err);
    res.status(500).send({ message: 'Internal server error' });
  }
});


// ---------- Trainer Slots Management ----------
app.get('/trainer-slots/:email', async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    
    // First get the trainer's basic info
    const trainer = await acceptedTrainersCollection.findOne({ email });
    if (!trainer) {
      return res.status(404).send({ message: 'Trainer not found' });
    }

    // Then get all slots for this trainer
    const trainerSlots = await slotsCollection.find({ trainerEmail: email }).toArray();

    // If no slots exist in slotsCollection, create default slots from trainer's availableDays
    if (trainerSlots.length === 0 && trainer.availableDays?.length > 0) {
      const defaultSlots = trainer.availableDays.map(day => ({
        trainerEmail: email,
        trainerId: trainer._id,
        day,
        time: trainer.availableTime || 'Not specified',
        package: 'Basic',
        isBooked: false,
        bookedBy: null,
        createdAt: new Date()
      }));

      if (defaultSlots.length > 0) {
        await slotsCollection.insertMany(defaultSlots);
        return res.send(defaultSlots);
      }
    }

    res.send(trainerSlots);
  } catch (err) {
    console.error('Error fetching trainer slots:', err);
    res.status(500).send({ message: 'Internal server error' });
  }
});

app.delete('/trainer-slots/:id', async (req, res) => {
  try {
    const slotId = req.params.id;
    
    // First check if the slot exists
    const slot = await slotsCollection.findOne({ _id: new ObjectId(slotId) });
    if (!slot) {
      return res.status(404).send({ message: 'Slot not found' });
    }

    // Check if the slot is booked
    if (slot.isBooked) {
      return res.status(400).send({ message: 'Cannot delete a booked slot' });
    }

    // Delete the slot
    const result = await slotsCollection.deleteOne({ _id: new ObjectId(slotId) });
    
    if (result.deletedCount === 1) {
      res.send({ message: 'Slot deleted successfully' });
    } else {
      res.status(500).send({ message: 'Failed to delete slot' });
    }
  } catch (err) {
    console.error('Error deleting slot:', err);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Endpoint to create new slots (optional but useful)

app.post('/trainer-slots', async (req, res) => {
  try {
    const slot = req.body;
    const result = await slotsCollection.insertOne(slot);
    res.status(201).send({ message: 'Slot added', id: result.insertedId });
  } catch (err) {
    console.error('Error adding slot:', err);
    res.status(500).send({ message: 'Internal server error' });
  }
});

app.get('/trainers', async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).send({ message: 'Email is required' });

  const trainer = await acceptedTrainersCollection.findOne({ email });
  if (!trainer) return res.status(404).send({ message: 'Trainer not found' });

  res.send(trainer);
});


    // ---------- Start Server ----------
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (err) {
    console.error(err);
  }
}

run().catch(console.dir);