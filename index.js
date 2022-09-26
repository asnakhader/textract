// Import AWS
const AWS = require("aws-sdk")


// Set variables
var bucket = '' // the s3 source bucket name
const destbucket = 'textractdestinationbucket' // the s3 destination bucket name
var photo  = '' // the name of file
const regionConfig = 'ap-south-1'

// Set region if needed
AWS.config.update({region:regionConfig});

// Connect to Textract
const client = new AWS.Textract();
// Connect to S3 to display image
const s3 = new AWS.S3();

// Define paramaters
const params = {
  Document: {
    S3Object: {
      Bucket: bucket,
      Name: photo
    },
  },
}


exports.handler = async (event, context) => {
    var receivedMsg = '';
    let statusCode = 'SUCCESS';
    
    try{
		  //extract source bucket and object details from event
		  bucket = event['Records'][0]['s3']['bucket']['name'];
		  photo = event['Records'][0]['s3']['object']['key'];
		  
		  //update parameter with details from S3 event
		  params.Document.S3Object = {Bucket: bucket, Name: photo};
		  const res = await client.detectDocumentText(params).promise();

		  //append blocks of type word with spacing
		  res.Blocks.forEach(block => {
		
  		if( block.BlockType == 'WORD'){
      		if((block.Text.includes("."))){
                receivedMsg += ' ' +block.Text + '\n';
            }else{
      		  	receivedMsg += ' ' +block.Text;
          }
  		}

		  }) 
		  
		} catch (err){
		  statusCode = 'ERROR';
		  console.error(err);
		}
		//saving as text file
		var destfileName = photo.split('.')[0] + '.txt';

  	//log to S3
		var s3params = { 'Bucket': destbucket, 'Key': destfileName, 'Body': receivedMsg };
	  await s3.putObject(s3params).promise();
    console.log('success saved to s3');
        
    return {
        statusCode
    };
};
