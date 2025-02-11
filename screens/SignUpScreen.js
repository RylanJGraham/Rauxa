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
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const SignUpScreen = () => {
    const navigation = useNavigation();
    const { signInWithGoogle, signInWithGithub } = useAuth(); // ⬅️ Added GitHub auth

    const socialIcons = [
        { name: 'Apple', icon: require('../assets/login/apps/apple.png'), action: () => {} },
        { name: 'Google', icon: require('../assets/login/apps/google.png'), action: signInWithGoogle },
        { name: 'Facebook', icon: require('../assets/login/apps/facebook.png'), action: () => {} },
        { name: 'GitHub', icon: require('../assets/login/apps/github.png'), action: signInWithGithub }, // ⬅️ GitHub button
        { name: 'X', icon: require('../assets/login/apps/x.png'), action: () => {} },
    ];

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
                            <TextInput placeholder="Username" style={styles.input} placeholderTextColor="#666" />
                        </View>

                        <View style={styles.inputContainer}>
                            <Icon name="mail" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                placeholder="Email"
                                style={styles.input}
                                placeholderTextColor="#666"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Icon name="phone" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput
                                placeholder="Mobile Number"
                                style={styles.input}
                                placeholderTextColor="#666"
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput placeholder="Password" style={styles.input} placeholderTextColor="#666" secureTextEntry />
                        </View>

                        <TouchableOpacity style={styles.signUpButton}>
                            <Text style={styles.signUpButtonText}>SignUp</Text>
                        </TouchableOpacity>

                        <Text style={styles.dividerText}>or create an account using</Text>

                        <View style={styles.socialButtonsContainer}>
                            {socialIcons.map((icon) => (
                                <TouchableOpacity
                                    key={icon.name}
                                    style={styles.socialButton}
                                    onPress={icon.action} // ⬅️ Button action added
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
