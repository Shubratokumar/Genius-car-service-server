const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware 
app.use(cors())
app.use(express.json())

// verifing jwt
function verifyJWT(req, res, next){
    const authHeaders = req.headers.authorization;
    if(!authHeaders){
        return res.status(401).send({message: "Unautherized Access"})
    }
    const token = authHeaders.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
            return res.status(403).send({message: "Forbidden Access"});
        }
        // console.log("decoded", decoded);
        res.decoded = decoded;
        next()
    })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0a811.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){
    try{
        await client.connect();
        const serviceCollection = client.db("geniusCar").collection("service");
        const orderCollection = client.db("geniusCar").collection("order");

        // Auth API
        app.post('/login', (req, res)=>{
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            // console.log(accessToken)
            res.send({accessToken});
        })
        /* app.post('/login', async(req, res) =>{
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send(accessToken)
        }) */
        
        // SERVICES API
        // Load Data : services
        app.get('/service', async(req, res)=>{
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        // Load Single Data : service
        app.get('/service/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const service = await serviceCollection.findOne(query);
            res.send(service);
        })
        
        // POST 
        app.post('/service', async(req, res)=>{
            const newService = req.body;
            const result = await serviceCollection.insertOne(newService);
            res.send(result);
        })
        
        // DELETE
        app.delete('/service/:id',async(req, res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const service = await serviceCollection.deleteOne(query);
            res.send(service);
        })

        // Order Collection API
        // GET API
        app.get('/order', verifyJWT, async(req, res)=>{
            const decodedEmail = req.decoded?.email;
            const email = req.query.email;
            if(email === decodedEmail){
                const query = {email: email};
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray();
                // console.log(orders);
                res.send(orders)
            } else{
                res.status(403).send({message: "Unauthorized assess"})
            }
        })
        // post API 
        app.post('/order', async(req,res)=>{
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })
    }
    finally{

    }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send("Genius server is Running!!!");
})
app.get('/test', (req,res)=>{
    res.send("Testing the Heroku server is running or not.")
})

app.listen(port,()=>{
    console.log('Genius server is running under the port no :', port);
})