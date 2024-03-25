import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { initializeApp } from '@firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from '@firebase/auth';
import { initializeAuth, getReactNativePersistence } from '@firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase, ref, push } from '@firebase/database';
import { getFirestore, collection, addDoc, doc, getDoc, getDocs, query, where } from '@firebase/firestore';
import { useNavigation, NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';


const firebaseConfig = {
  apiKey: "AIzaSyAq9NU48BD6DNvbJLoyRTIhgbUhhLy8xK8",
  authDomain: "jhvjhvhj-1iezwa.firebaseapp.com",
  databaseURL: "https://jhvjhvhj-1iezwa-default-rtdb.firebaseio.com",
  projectId: "jhvjhvhj-1iezwa",
  storageBucket: "jhvjhvhj-1iezwa.appspot.com",
  messagingSenderId: "972335147101",
  appId: "1:972335147101:web:399848456360255dcc85b4"
};
const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
const db = getFirestore(app);
const AuthScreen = ({ email, setEmail, password, setPassword, isLogin, setIsLogin, handleAuthentication }) => {
  return (
    <View style={styles.authContainer}>
       <Text style={styles.title}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
       <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />
      <View style={styles.buttonContainer}>
        <Button title={isLogin ? 'Sign In' : 'Sign Up'} onPress={handleAuthentication} color="#3498db" />
      </View>

      <View style={styles.bottomContainer}>
        <Text style={styles.toggleText} onPress={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
        </Text>
      </View>
    </View>
  );
}


const AuthenticatedScreen = ({ user, handleAuthentication }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true); // New loading state

  const getData = async () => {
    try {
      const q = query(collection(db, "users"), where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        console.log(doc.id, " => ", doc.data());
        setUserInfo(doc.data());
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false); // Set loading to false when data fetching is complete
    }
  }
  
  useEffect(() => {
    getData();
  }, [user]); // Trigger the effect whenever the user prop changes

  if (loading) {
    return (
      <View style={[styles.authContainer, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.authContainer}>
      <Text style={styles.title}>Welcome {userInfo?.role}!</Text>
      <Text style={styles.title}>Department: {userInfo?.department}</Text>
      <Text style={styles.emailText}>{userInfo?.email}</Text>
      <Button title="Logout" onPress={handleAuthentication} color="#e74c3c" />
    </View>
  );
};



export default App = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null); // Track user authentication state
  const [isLogin, setIsLogin] = useState(true);

  const auth = getAuth(app);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, [auth]);

  
  const handleAuthentication = async () => {
    try {
        if (user) {
            // If user is already authenticated, log out
            console.log('User logged out successfully!');
            await signOut(auth);
        } else {
            // Sign in or sign up
            if (isLogin) {
                // Sign in
                await signInWithEmailAndPassword(auth, email, password);
                console.log('User signed in successfully!');
            } else {
                // Sign up
                if (
                    (email.endsWith('@online.htcgsc.edu.ph') &&
                        (email.includes('cete') ||
                            email.includes('ccje') ||
                            email.includes('cte') ||
                            email.includes('cbma') ||
                            email.includes('cas'))) ||
                    email.endsWith('@admin.com') ||
                    email.endsWith('@officer.com')
                ) {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    const newUser = userCredential.user;

                    let role = '';
                    let department = '';

                    if (email.endsWith('@online.htcgsc.edu.ph')) {
                        if (email.includes('cete')) {
                            department = 'CETE';
                        } else if (email.includes('ccje')) {
                            department = 'CCJE';
                        } else if (email.includes('cte')) {
                            department = 'CTE';
                        } else if (email.includes('cbma')) {
                            department = 'CBMA';
                        } else if (email.includes('cas')) {
                            department = 'CAS';
                        } else {
                            department = 'unknown';
                        }
                        role = 'Student';
                        await addDoc(collection(db, 'users'), {
                            email: email,
                            role: role,
                            uid: newUser.uid,
                            department: department,
                        });
						

                        await addDoc(collection(db, 'clearance'), {
                          userId: newUser.uid,
                          signed: false, 
                      });

                    } else if (email.endsWith('@admin.com')) {
                        role = 'Admin';
                        await addDoc(collection(db, 'users'), {
                            email: email,
                            role: role,
                            uid: newUser.uid,
                        });
                    } else if (email.endsWith('@officer.com')) {
                        role = 'Officer';
                        await addDoc(collection(db, 'users'), {
                            email: email,
                            role: role,
                            uid: newUser.uid,
                        });
                    }

                    console.log('User created successfully!');
                } else {
                    throw new Error('Invalid email format for sign up');
                }
            }
        }
    } catch (error) {
        console.error('Authentication error:', error.message);
    }
};



  return (
    <ScrollView contentContainerStyle={styles.container}>
      {user ? (
        // Show user's email if user is authenticated
        <AuthenticatedScreen user={user} handleAuthentication={handleAuthentication} />
      ) : (
        // Show sign-in or sign-up form if user is not authenticated
        <AuthScreen
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          isLogin={isLogin}
          setIsLogin={setIsLogin}
          handleAuthentication={handleAuthentication}
        />
      )}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  authContainer: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 16,
    padding: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  toggleText: {
    color: '#3498db',
    textAlign: 'center',
  },
  bottomContainer: {
    marginTop: 20,
  },
  emailText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
});