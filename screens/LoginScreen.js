import React from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    Image, 
    ScrollView, 
    SafeAreaView,
    StyleSheet,
    Button,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import Icon from 'react-native-vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';  // Changed to expo-linear-gradient
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
  const navigation = useNavigation();

    const socialIcons = [
        { name: 'Apple', icon: require('../assets/login/apps/apple.png')  },
        { name: 'Google', color: '#DB4437' },
        { name: 'Facebook', color: '#4267B2' },
        { name: 'GitHub', color: '#333' },
    ];

    const { signInWithGoogle } = useAuth();

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

                    <Text style={[styles.title, { color: 'white' }]}>Welcome Back to Rauxa</Text>

                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <Icon 
                                name="user" 
                                size={20} 
                                color="#666" 
                                style={styles.inputIcon} 
                            />
                            <TextInput
                                placeholder="Username"
                                style={styles.input}
                                placeholderTextColor="#666"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Icon 
                                name="lock" 
                                size={20} 
                                color="#666" 
                                style={styles.inputIcon} 
                            />
                            <TextInput
                                placeholder="Password"
                                style={styles.input}
                                placeholderTextColor="#666"
                                secureTextEntry
                            />
                        </View>

                        <Text style={[styles.helpText]}>Forgot Your Password?</Text>

                        <TouchableOpacity style={styles.signUpButton}>
                            <Text style={styles.signUpButtonText}>Login</Text>
                        </TouchableOpacity>

                        <View style={styles.bottomTextContainer}>
                            <Text style={styles.bottomText}>Don't Have an Account? </Text>
                            <TouchableOpacity>
                                <Button 
                                    title="Create" 
                                    onPress={() => navigation.navigate("SignUp")}>
                                </Button>
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
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    socialButton: {
        width: '20%',
        aspectRatio: 1,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
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
    helpText: {
      color: '#FBFCFF',
      fontSize: 14,
      textAlign: 'right',
      marginBottom: 12,
  },
    signInLink: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default LoginScreen;