const express = require("express");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const cors = require("cors");
const ObjectId = require("mongodb").ObjectId;
const fileUpload = require("express-fileupload");

const app = express();
const port = process.env.PORT || 4000;

// middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xuu56.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("eShop");
    const productsCollection = database.collection("products");
    const usersCollection = database.collection("users");
    const ordersCollection = database.collection("orders");

    // add user
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.json(result);
    });

    // login in email or github set user
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    // set admin
    app.put("/users/admin", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const updateDoc = { $set: { role: "admin" } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    // get admin
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    // Add Product
    app.post("/products", async (req, res) => {
      const cursor = req.body;
      const pic = req.files.image;
      const picData = pic.data;
      console.log(picData);
      const encodedPic = picData.toString("base64");
      const imageBuffer = Buffer.from(encodedPic, "base64");
      const productDetails = { ...cursor, image: imageBuffer };

      const result = await productsCollection.insertOne(productDetails);
      res.json(result);
    });

    //get all Products
    app.get("/all-products", async (req, res) => {
      const result = await productsCollection.find({}).toArray();
      res.json(result);
    });

    // get home product
    app.get("/homeproducts", async (req, res) => {
      const result = await productsCollection.find({}).limit(12).toArray();
      res.json(result);
    });

    // search product by catagories
    app.get("/catagories", async (req, res) => {
      const catagories = req.query.catagories;
      const query = { catagories: catagories };
      const result = await productsCollection.find(query).toArray();
      res.json(result);
    });

    // search product by catagories & type
    app.get("/equipment", async (req, res) => {
      const catagories = req.query.catagories;
      const type = req.query.type;
      const query = { catagories: catagories, type: type };

      const result = await productsCollection.find(query).toArray();
      res.json(result);
    });

    // search Product
    app.get("/search", async (req, res) => {
      const products = await productsCollection.find({}).toArray();
      const search = req.query.name;

      const searchResult = products.filter((product) =>
        product.name.toLowerCase().includes(search.toLowerCase())
      );

      res.json(searchResult);
    });

    // search product by catagories & brand
    app.get("/brands", async (req, res) => {
      const catagories = req.query.catagories;
      const brand = req.query.brand;
      const query = { catagories: catagories, brand: brand };
      console.log(query);

      const result = await productsCollection.find(query).toArray();
      res.json(result);
    });

    // get single product by id
    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };

      const result = await productsCollection.findOne(query);
      res.json(result);
    });

    // Update Product
    app.put("/update/:id", async (req, res) => {
      const id = req.params.id;
      const updateService = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };

      const updateDoc = {
        $set: {
          name: updateService.name,
          price: updateService.price,
          rating: updateService.rating,
          catagories: updateService.catagories,
          type: updateService.type,
          availabilities: updateService.availabilities,
          brand: updateService.brand,
          details: updateService.details,
        },
      };
      const result = await productsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    //GET Products with pagination
    app.get("/products", async (req, res) => {
      const cursor = productsCollection.find({});
      const page = req.query.page;
      const size = parseInt(req.query.size);
      let products;
      const count = await cursor.count();

      if (page) {
        products = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        products = await cursor.toArray();
      }

      res.send({
        count,
        products,
      });
    });

    // Delete Product
    app.delete("/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("eShop Server is continue starting");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
