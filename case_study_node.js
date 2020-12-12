var fs = require("fs");
var express=require('express');
var app=express();
var bodyParser=require('body-parser');
var mysql=require('mysql');
var urlencodedParser = bodyParser.urlencoded({ extended: false })
const bucketName = 'sivabucket21';
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();


var connection = mysql.createConnection({
    host: "sampledatabase.camezis8cexa.us-east-1.rds.amazonaws.com",
    user: "admin",
    password: "12345678",
    database: "mydb"
});

connection.connect(function (err) {
    if (err) {
      console.error('Database connection failed: ' + err.stack);
      return;
    }
    console.log('Connected to RDS.');
  });




app.post('/custcreate',urlencodedParser,function(req,res){
    
    var username=req.body.username;
    var password=req.body.password;
    
    var sql="Insert into customer_table (username, password) values('"+username+"','"+password+"')";
    connection.query(sql, function (error, results, fields) { 
        
        if (error) throw error;

        else
        {
            res.send("Succesfully submitted the login details");
        }

    }); 
    
});

app.post('/adminview',urlencodedParser,function(req,res){
    
    var username=req.body.username;
    var password=req.body.password;
    

    connection.query('Select * from admin_table', function (error, results, fields) { 
        
        
        var test=0;
        var length=results.length;
        
        for(i=0;i<length;i++)
        {
            if(results[i].username==username && results[i].password==password)
            {
                test=1;
            }
        }
        var str="";
        if(test==1)
        {
            connection.query("Select * from customer_request", function (error, results, fields){
                console.log(results.length);
                var i=0;

                for(i=0;i<results.length;i++)
                {
                    str=str+("Username: "+results[i].username+"<br/>Income: "+results[i].income+"<br/>Reason: "+results[i].reason);
                    str=str+"<br/><br/><br/>"
                    
                }
                console.log(str);
                res.send(str);

            });
            
        }
        else
        {
            res.send("Admin Username or Password is incorrect");
        }
        
    });
    
});

app.post('/custsubmit',urlencodedParser,function(req,res){
    
    var username=req.body.username;
    var password=req.body.password;
    var firstname=req.body.firstname;
    var lastname=req.body.lastname;
    var age=req.body.age;
    var profession=req.body.profession;
    var income=req.body.income;
    var street=req.body.street;
    var district=req.body.district;
    var state=req.body.state;
    var pincode=req.body.pincode;
    var reason="New";
    var card="Not alloted";

    connection.query('Select * from customer_table', function (error, results, fields) { 
        
        
        var test=0;
        var length=results.length;

        for(i=0;i<length;i++)
        {
            if(results[i].username==username && results[i].password==password)
            {
                test=1;
                break;
            }
        }
        if(test==1)
        {
            var sql="Insert into customer_submit (username, firstname, lastname, age, profession, income, street, district, state, pincode) values('"+username+"','"+firstname+"','"+lastname+"',"+age+",'"+profession+"',"+income+",'"+street+"','"+district+"','"+state+"',"+pincode+")";
            connection.query(sql, function (error, results, fields) { 
        
                if (error) throw error;

                else
                {

                    sql="Insert into customer_request (username, income, reason) values('"+username+"',"+income+",'"+reason+"')";
                    connection.query(sql, function (error, results, fields) { 
                
                        if (error) throw error;
        
                        else
                        {
                            
                            var createStream = fs.createWriteStream(username+".txt");
                            createStream.end();

                            var writeStream = fs.createWriteStream(username+".txt");
                            writeStream.write("Username: "+username);
                            writeStream.write("\nFirst name: "+firstname);
                            writeStream.write("\Last name: "+lastname);
                            writeStream.write("\nage: "+age);
                            writeStream.write("\nProfession: "+profession);
                            writeStream.write("\nIncome: "+income);
                            writeStream.write("\nStreet: "+street);
                            writeStream.write("\nDistrict: "+district);
                            writeStream.write("\nState: "+state);
                            writeStream.write("\nPincode: "+pincode);
                            
                            writeStream.end();
                            var filename = username+".txt";

                            async function uploadFile() {
                            
                                await storage.bucket(bucketName).upload(filename, {
                                  gzip: true,
                                  
                                  metadata: {
                                    cacheControl: 'public, max-age=31536000',
                                  },
                                });
                              
                                console.log(`${filename} uploaded to ${bucketName}.`);
                              }
                              
                              uploadFile().catch(console.error);

                            res.send("Succesfully submitted the details and uploaded to Google Cloud Storage");
                        }
        
                    });

                    
                }

            }); 
        }
        else
        {
            res.send("Please Enter a valid username or password");
        }
        
    });  
    
});

app.post('/custrequest',urlencodedParser,function(req,res){
    
    var username=req.body.username;
    var password=req.body.password;
    var income=req.body.income;
    var reason=req.body.reason;
    

    var sql="Select username from customer_submit where username='"+username+"'";
    connection.query(sql, function (error, results, fields) { 
        
        

        if(results.length!=0)
        {
            sql="Select password from customer_table where username='"+results[0].username+"'";
            
            connection.query(sql, function (error, results, fields) {
                
                if(results[0].password==password)
                {
                    
                    sql="Insert into customer_request (username, income, reason) values('"+username+"',"+income+",'"+reason+"')";
                    connection.query(sql, function (error, results, fields) { 
                
                    if (error) 
                    {
                        res.send("You cannot request now");
                    }
        
                    else
                    {
                        res.send("Succesfully submitted the request");
                    }
        
                    });
                }
                else
                {
                    res.send("Please Enter a valid username or password");
                }

            });

        }
        
        
    });   
    
});

app.post('/custupdate',urlencodedParser,function(req,res){
    
    var username=req.body.username;
    var card=req.body.card;
    var secretcode=req.body.secretcode;

    if(secretcode!="X2108")
    {
        res.send("Please Enter the secret code to update");
    }

    else
    {

    
    connection.query('Select username from customer_submit', function (error, results, fields) { 
        
        var test=0;
        var length=results.length;

        for(i=0;i<length;i++)
        {
            if(results[i].username==username)
            {
                test=1;
                break;
            }
        }
        if(test==1)
        {
            connection.query("Select username from customer_card where username='"+username+"'", function (error, results, fields) {

                if(results.length==0)
                {
                    var sql="Insert into customer_card (username, card) values('"+username+"','"+card+"')";
                    connection.query(sql, function (error, results, fields) { 
                
                    if (error) throw error;
        
                    else
                    {

                        res.send("Succesfully inserted the card type");
                    }
        
                    });

                    sql="Delete from customer_request where username='"+username+"'";
                    connection.query(sql, function (error, results, fields) { 
                
                    if (error) throw error;
        
                    });

                }

                else
                {
                    var sql="Update customer_card set card='"+card+"' where username='"+username+"'";
                    connection.query(sql, function (error, results, fields) { 
                
                    if (error) throw error;
        
                    else
                    {
                        res.send("Succesfully updated the card type");
                    }
        
                    });

                    sql="Delete from customer_request where username='"+username+"'";
                    connection.query(sql, function (error, results, fields) { 
                
                    if (error) throw error;
        
                    });


                }
                
            });
            
        }
        else
        {
            res.send("No customers found with this username");
        }
        
    });  
    }

});

app.post('/custview',urlencodedParser,function(req,res){
    
    var username=req.body.username;
    var password=req.body.password;
    
    
    var sql="Select password from customer_table where username='"+username+"'";
    connection.query(sql, function (error, results, fields) { 
        
        if (error) throw error;

        else
        {
            if(results.length==0)
            {
                res.send("Please enter valid login details");
            }
            else
            {
                if(results[0].password==password)
                {
                    var str="Not Alloted"
                    sql="Select card from customer_card where username='"+username+"'";
                    connection.query(sql, function (error, results, fields) { 
                        if(results.length!=0)
                        {
                            str=results[0].card;
                        }
                        

                    });

                    var sql="Select * from customer_submit where username='"+username+"'";
                    connection.query(sql, function (error, results, fields) { 
                        res.send("Username: "+results[0].username+"<br/>First name: "+results[0].firstname+"<br/>Last name: "+results[0].lastname+"<br/>Age: "+results[0].age+"<br/>Profession: "+results[0].profession+"<br/>Income: "+results[0].income+"<br/>Street: "+results[0].street+"<br/>District: "+results[0].district+"<br/>State: "+results[0].state+"<br/>Pincode: "+results[0].pincode+"<br/>Card Type: "+str);

                    });
                    


                }
                else
                {
                    res.send("Please enter valid password");
                }
            }
        }

    }); 
    
});


app.listen(8000, function(err){ 
    if (err) console.log(err); 
    console.log("Server listening on 8000"); 
}); 





