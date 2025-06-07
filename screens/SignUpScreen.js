import React, { useState } from 'react';
import { Alert } from 'react-native';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    SafeAreaView,
    StyleSheet,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import Icon from 'react-native-vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

const SignUpScreen = () => {
    const navigation = useNavigation();
    // Destructure only Google and GitHub sign-in methods
    const { signInWithGoogle, signInWithGithub } = useAuth(); // <-- REMOVED signInWithFacebook

    // State variables for form inputs
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');

    const socialIcons = [
        { name: 'Apple', icon: require('../assets/login/apps/apple.png'), action: () => Alert.alert("Coming Soon", "Apple Sign-In is not yet implemented.") },
        { name: 'Google', icon: require('../assets/login/apps/google.png'), action: signInWithGoogle },
        // Removed Facebook social icon:
        // { name: 'Facebook', icon: require('../assets/login/apps/facebook.png'), action: signInWithFacebook }, 
        { name: 'GitHub', icon: require('../assets/login/apps/github.png'), action: signInWithGithub },
        { name: 'X', icon: require('../assets/login/apps/x.png'), action: () => Alert.alert("Coming Soon", "X (Twitter) Sign-In is not yet implemented.") },
    ];

    const handleSignUp = async () => {
        if (!username || !email || !mobile || !password) {
            Alert.alert('Error', 'All fields are required!');
            return;
        }

        try {
            const emailQuerySnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
            if (!emailQuerySnapshot.empty) {
                Alert.alert('Error', 'An account with this email already exists.');
                return;
            }

            const usernameQuerySnapshot = await getDocs(query(collection(db, 'usernames'), where('username', '==', username)));
            if (!usernameQuerySnapshot.empty) {
                Alert.alert('Error', 'Username is already taken.');
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, 'users', user.uid), {
                username,
                email,
                mobile,
                uid: user.uid,
                onboarded: false,
                profileCreatedAt: new Date(),
            });
            await setDoc(doc(db, 'usernames', username), { uid: user.uid });

            Alert.alert('Success', 'Account created successfully!');
            navigation.navigate('Login');
        } catch (error) {
            console.error("Firebase Email/Password Sign-up Error:", error);
            Alert.alert('Sign Up Failed', error.message);
        }
    };

    return (
        <LinearGradient
            colors={['#0367A6', '#D9043D']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../assets/login/Login_Logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    <Text style={[styles.title, { color: 'white' }]}>Create Your Rauxa Account</Text>

                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <Icon name="user" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                placeholder="Username"
                                style={styles.input}
                                placeholderTextColor="#666"
                                value={username}
                                onChangeText={setUsername}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Icon name="mail" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                placeholder="Email"
                                style={styles.input}
                                placeholderTextColor="#666"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Icon name="phone" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                placeholder="Mobile Number"
                                style={styles.input}
                                placeholderTextColor="#666"
                                keyboardType="phone-pad"
                                value={mobile}
                                onChangeText={setMobile}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                placeholder="Password"
                                style={styles.input}
                                placeholderTextColor="#666"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>

                        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
                            <Text style={styles.signUpButtonText}>Sign Up</Text>
                        </TouchableOpacity>

                        <Text style={styles.dividerText}>or create an account using</Text>

                        <View style={styles.socialButtonsContainer}>
                            {socialIcons.map((icon) => (
                                <TouchableOpacity
                                    key={icon.name}
                                    style={styles.socialButton}
                                    onPress={icon.action}
                                >
                                    <Image source={icon.icon} style={styles.socialIcon} resizeMode="contain" />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.bottomTextContainer}>
                            <Text style={styles.bottomText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                                <Text style={styles.signInLink}>Go to Login</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 16,
    },
    logoContainer: {
        width: 64,
        height: 64,
        marginBottom: 32,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: 40,
        fontWeight: 'bold',
        marginBottom: 32,
        flexWrap: 'wrap',
        textAlign: 'center',
    },
    formContainer: {
        width: '100%',
        maxWidth: 320,
    },
    inputContainer: {
        marginBottom: 16,
        position: 'relative',
    },
    input: {
        backgroundColor: '#00000040',
        borderRadius: 24,
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderWidth: 1,
        borderColor: '#F2BB47',
        fontSize: 16,
        color: 'white',
    },
    inputIcon: {
        position: 'absolute',
        left: 12,
        top: 14,
        zIndex: 1,
    },
    signUpButton: {
        backgroundColor: '#D9043D',
        borderRadius: 24,
        paddingVertical: 8,
        marginTop: 8,
    },
    signUpButtonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '600',
    },
    dividerText: {
        textAlign: 'center',
        color: '#FBFCFF',
        marginVertical: 24,
    },
    socialButtonsContainer: {
        flexDirection: 'row',
        flexWrap: 'no-wrap',
        justifyContent: 'center',
        gap: 8,
    },
    socialButton: {
        width: '20%',
        aspectRatio: 1,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
    },
    socialIcon: {
        width: '100%',
        height: '100%',
    },
    bottomTextContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
    },
    bottomText: {
        color: 'white',
        fontSize: 14,
    },
    signInLink: {
        color: 'yellow',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default SignUpScreen;