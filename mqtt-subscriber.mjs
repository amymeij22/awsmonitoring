import mqtt from 'mqtt';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Explicitly load the .env.local file
dotenv.config({ path: './.env.local' });

// Check if environment variables are loaded correctly
console.log('Supabase URL:', process.env.SUPABASE_URL);
console.log('Supabase Key:', process.env.SUPABASE_KEY);

// Supabase client initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL or key is missing in the environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// MQTT client options
const options = {
  host: process.env.HIVEMQ_URL,
  port: process.env.HIVEMQ_PORT,
  protocol: 'mqtts',
  username: process.env.HIVEMQ_USERNAME,
  password: process.env.HIVEMQ_PASSWORD,
  rejectUnauthorized: false,  // Allow insecure SSL/TLS connections (set to true if you have proper certificates)
};

// Create MQTT client
const client = mqtt.connect(options);

// Handle connection
client.on('connect', () => {
  console.log('Connected to HiveMQ Cloud');
  client.subscribe('awsData', (err) => {
    if (!err) {
      console.log('Subscribed to awsData topic');
    } else {
      console.error('Subscription error:', err);
    }
  });
});

// Mapping function to handle data transformation
const mapDataToDatabaseFormat = (data) => {
  const mappedData = {};

  // Iterate over each key in the incoming data and map it to the appropriate database column
  for (const key in data) {
    // Normalize the key (handle case and replace dots with underscores)
    const normalizedKey = key
      .toLowerCase()                // Convert to lowercase
      .replace('.', '_');           // Replace dots with underscores

    // Map the normalized key to the appropriate database column if it exists
    switch (normalizedKey) {
      case 'temp':
        mappedData['temp'] = data[key];
        break;
      case 'rh':
        mappedData['rh'] = data[key];
        break;
      case 'wind_direction':
        mappedData['wind_direction'] = data[key];
        break;
      case 'wind_speed':
        mappedData['wind_speed'] = data[key];
        break;
      case 'pressure':
        mappedData['pressure'] = data[key];
        break;
      case 'radiation':
        mappedData['radiation'] = data[key];
        break;
      case 'precipitation':
        mappedData['precipitation'] = data[key];
        break;
      default:
        console.warn(`Unknown key: ${key}`);
    }
  }

  return mappedData;
};

// Handle incoming messages
client.on('message', async (topic, message) => {
  console.log('Received message on topic:', topic);
  try {
    const data = JSON.parse(message.toString());
    console.log('Received data:', data);

    // Map the incoming data to the database format
    const formattedData = mapDataToDatabaseFormat(data);
    console.log('Formatted data for database:', formattedData);

    // Insert data into Supabase
    const { error } = await supabase
      .from('awsdata')
      .insert([formattedData]);

    if (error) {
      console.error('Error inserting data:', error);
    } else {
      console.log('Data inserted successfully');
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
});

// Handle errors
client.on('error', (error) => {
  console.error('MQTT Error:', error);
});

// Handle close
client.on('close', () => {
  console.log('Connection closed');
});

console.log('MQTT Subscriber started. Waiting for messages...');
