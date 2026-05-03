import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, Button, FlatList,
  ActivityIndicator, Alert, SafeAreaView,
} from 'react-native';
import axios from 'axios';
import { supabase } from './supabaseConfig';

// IMPORTANT: Replace with your actual local IP address
const BASE_URL = 'http://192.168.0.106:3000';

type Role = 'PASSENGER' | 'HAMALI' | null;

interface Trip {
  id: number;
  pickup: string;
  drop: string;
  status: 'REQUESTED' | 'ACCEPTED';
  userId: string;
}

export default function App() {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Auth State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  // Passenger State
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [passengerTrips, setPassengerTrips] = useState<Trip[]>([]);

  // Hamali State
  const [availableTrips, setAvailableTrips] = useState<Trip[]>([]);

  // Setup Axios auth header whenever token changes
  useEffect(() => {
    if (userToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [userToken]);

  // ─── AUTH FUNCTIONS ───────────────────────────────────────────────────────

  const sendOTP = async () => {
    setErrorMsg('');

    // Phone Number Validation
    const isOnlyNumbersAfterPlus = /^\+[0-9]+$/.test(phoneNumber);
    if (!phoneNumber.startsWith('+') || phoneNumber.length < 12 || !isOnlyNumbersAfterPlus) {
      setErrorMsg('Enter valid phone number with country code (e.g., +91XXXXXXXXXX)');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({ phone: phoneNumber });
      if (error) throw error;
      setOtpSent(true);
      Alert.alert('Success', 'OTP sent to your phone!');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmOTP = async () => {
    setErrorMsg('');
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otp,
        type: 'sms',
      });
      if (error) throw error;
      const token = data.session?.access_token;
      if (!token) throw new Error('No session token received.');
      setUserToken(token);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── API FUNCTIONS ────────────────────────────────────────────────────────

  const requestTrip = async () => {
    setErrorMsg('');

    // Empty Input Validation
    if (!pickup.trim() || !drop.trim()) {
      setErrorMsg('Please enter pickup and drop location');
      return;
    }

    // Same Pickup & Drop Validation
    if (pickup.trim().toLowerCase() === drop.trim().toLowerCase()) {
      setErrorMsg('Pickup and drop cannot be same');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${BASE_URL}/trips`, { pickup, drop });
      Alert.alert('Success', 'Trip requested!');
      setPickup('');
      setDrop('');
      fetchTrips();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrips = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/trips`);
      if (role === 'HAMALI') {
        setAvailableTrips(res.data.filter((t: Trip) => t.status === 'REQUESTED'));
      } else {
        setPassengerTrips(res.data);
      }
    } catch (err: any) {
      console.log('Fetch error:', err.message);
    }
  };

  const acceptTrip = async (id: number) => {
    setErrorMsg('');
    try {
      await axios.post(`${BASE_URL}/trips/${id}/accept`);
      Alert.alert('Success', 'Trip accepted!');
      fetchTrips();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  // Hamali Auto-refresh every 3 seconds
  useEffect(() => {
    let interval: any;
    if (userToken && role === 'HAMALI') {
      fetchTrips();
      interval = setInterval(fetchTrips, 3000);
    }
    return () => clearInterval(interval);
  }, [userToken, role]);

  // ─── SCREENS ──────────────────────────────────────────────────────────────

  // Auth Screen
  if (!userToken) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Railway Auth</Text>
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        {!otpSent ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Phone Number (e.g., +919999999999)"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
            <Button title="Send OTP" onPress={sendOTP} disabled={loading} />
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Enter OTP"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
            />
            <Button title="Verify OTP" onPress={confirmOTP} disabled={loading} />
          </>
        )}
        {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
      </SafeAreaView>
    );
  }

  // Role Selection Screen
  if (!role) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Select Your Role</Text>
        <View style={styles.buttonContainer}>
          <Button title="Passenger" onPress={() => setRole('PASSENGER')} />
          <View style={{ height: 20 }} />
          <Button title="Hamali" onPress={() => setRole('HAMALI')} />
        </View>
      </SafeAreaView>
    );
  }

  // Passenger Screen
  if (role === 'PASSENGER') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Passenger View</Text>
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Pickup (e.g., Entrance)"
            value={pickup}
            onChangeText={setPickup}
          />
          <TextInput
            style={styles.input}
            placeholder="Drop (e.g., Platform 2)"
            value={drop}
            onChangeText={setDrop}
          />
          <Button title="Request Assistance" onPress={requestTrip} disabled={loading} />
        </View>

        <Text style={styles.subtitle}>All Trips:</Text>
        <Button title="Refresh List" onPress={fetchTrips} />
        <FlatList
          data={passengerTrips}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text>From: {item.pickup}</Text>
              <Text>To: {item.drop}</Text>
              <Text style={{ fontWeight: 'bold' }}>Status: {item.status}</Text>
            </View>
          )}
        />
        <View style={{ marginTop: 20 }}>
          <Button title="Back to Roles" color="red" onPress={() => setRole(null)} />
        </View>
      </SafeAreaView>
    );
  }

  // Hamali Screen
  if (role === 'HAMALI') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Hamali View</Text>
        <Text style={{ marginBottom: 10, textAlign: 'center' }}>Refreshing every 3s...</Text>
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <FlatList
          data={availableTrips}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text>Pickup: {item.pickup}</Text>
              <Text>Drop: {item.drop}</Text>
              <View style={{ marginTop: 10 }}>
                <Button title="Accept Trip" onPress={() => acceptTrip(item.id)} />
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={{ textAlign: 'center' }}>No requested trips.</Text>}
        />
        <View style={{ marginTop: 20 }}>
          <Button title="Back to Roles" color="red" onPress={() => setRole(null)} />
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    marginTop: 40,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  buttonContainer: {
    padding: 20,
  },
  form: {
    marginBottom: 20,
  },
  card: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
});
