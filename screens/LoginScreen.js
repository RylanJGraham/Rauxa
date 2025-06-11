import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../firebase';  // Firebase import
import { signInWithEmailAndPassword } from 'firebase/auth';

const LoginScreen = () => {
    const navigation = useNavigation();

    // State for user input
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Handle login with Firebase
    const handleLogin = async () => {
        setError(''); // Clear previous errors
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError(err.message); // Show error message if login fails
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
                            source={require('../assets/onboarding/Onboarding1.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    <Text style={[styles.title, { color: 'white' }]}>Welcome Back to Rauxa</Text>

                    <View style={styles.formContainer}>
                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <Icon name="user" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                placeholder="Email"
                                style={styles.input}
                                placeholderTextColor="#666"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        {/* Password Input */}
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

                        {/* Display Error Message */}
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <Text style={[styles.helpText]}>Forgot Your Password?</Text>

                        {/* Login Button */}
                        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                            <Text style={styles.loginButtonText}>Login</Text>
                        </TouchableOpacity>

                        {/* Signup Navigation */}
                        <View style={styles.bottomTextContainer}>
                            <Text style={styles.bottomText}>Don't Have an Account? </Text>
                            {/* Unified "Create" button for both platforms */}
                            <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
                                <Text style={styles.createAccountText}>Create</Text>
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
        alignItems: 'center', // Centers content horizontally
        paddingTop: 80, // Increased top padding to push content down
        paddingBottom: 48, // Keeping some bottom padding, adjust as needed
        paddingHorizontal: 16,
    },
    logoContainer: {
        width: 200,
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
        marginBottom: 6,
        marginTop: 6,
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
    loginButton: {
        backgroundColor: '#D9043D',
        borderRadius: 24,
        paddingVertical: 8,
        marginTop: 8,
    },
    loginButtonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '600',
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
    helpText: {
      color: '#FBFCFF',
      fontSize: 14,
      textAlign: 'right',
      marginBottom: 12,
  },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginVertical: 8,
    },
    createAccountText: {
        color: '#2196F3',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 4,
    },
});

export default LoginScreen;