// App.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  Easing,
} from 'react-native';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';

messaging().setBackgroundMessageHandler(
  async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    // In background/killed state, we rely on the native service to show notifications.
    // If you also want to persist them locally, you could write to AsyncStorage here.
  },
);

type Message = { id: string; text: string; fromMe: boolean };

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Welcome! This is your messenger.', fromMe: false },
  ]);
  const [input, setInput] = useState('');
  const [bannerText, setBannerText] = useState<string | null>(null);
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const listRef = useRef<FlatList<Message>>(null);

  // Slide the banner down, then up again
  const showBanner = (text: string) => {
    setBannerText(text);
    Animated.sequence([
      Animated.timing(bannerAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.delay(2000),
      Animated.timing(bannerAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
    ]).start(() => setBannerText(null));
  };

  // 1️⃣ Permission & Token
  useEffect(() => {
    async function initFCM() {
      if (Platform.OS === 'android') {
        const res = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Allow Notifications',
            message: 'Enable to receive messages in this chat',
            buttonPositive: 'OK',
          },
        );
        if (res !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied');
          return;
        }
      }
      await messaging().registerDeviceForRemoteMessages();
      const token = await messaging().getToken();
      console.log('[FCM Token]', token);
    }
    initFCM();
  }, []);

  // 2️⃣ Foreground notifications → convert to chat messages + banner
  useEffect(() => {
    const unsubscribe = messaging().onMessage(
      async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        const body = remoteMessage.notification?.body ?? 'New message';
        // Add to chat
        const newMsg: Message = {
          id: Date.now().toString(),
          text: body,
          fromMe: false,
        };
        setMessages(prev => [...prev, newMsg]);
        // Show in-app banner
        showBanner(body);
        // Scroll to bottom
        listRef.current?.scrollToEnd({ animated: true });
      },
    );
    return unsubscribe;
  }, []);

  // 3️⃣ Notification taps (background → list)
  useEffect(() => {
    const sub = messaging().onNotificationOpenedApp(remoteMessage => {
      const body = remoteMessage.notification?.body ?? 'Opened notification';
      const msg: Message = {
        id: (Date.now() + 1).toString(),
        text: body,
        fromMe: false,
      };
      setMessages(prev => [...prev, msg]);
      listRef.current?.scrollToEnd({ animated: false });
    });
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          const body = remoteMessage.notification?.body ?? '';
          const msg: Message = {
            id: (Date.now() + 2).toString(),
            text: body,
            fromMe: false,
          };
          setMessages(prev => [...prev, msg]);
        }
      });
    return () => sub();
  }, []);

  // Send from input bar
  const send = () => {
    if (!input.trim()) return;
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), text: input.trim(), fromMe: true },
    ]);
    setInput('');
    listRef.current?.scrollToEnd({ animated: true });
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.bubble,
        item.fromMe ? styles.bubbleRight : styles.bubbleLeft,
      ]}>
      <Text style={styles.bubbleText}>{item.text}</Text>
    </View>
  );

  // Banner translateY: -50 → 0
  const translateY = bannerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, 0],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0084ff" />

      {/* In-App Banner */}
      {bannerText !== null && (
        <Animated.View
          style={[
            styles.banner,
            { transform: [{ translateY }] },
          ]}>
          <Text style={styles.bannerText}>{bannerText}</Text>
        </Animated.View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Messenger</Text>
      </View>

      {/* Chat List + Input */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.chatContainer}
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity style={styles.sendButton} onPress={send}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f0f0' },

  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0084ff',
    paddingVertical: 12,
    zIndex: 10,
    alignItems: 'center',
  },
  bannerText: { color: '#fff', fontSize: 16 },

  header: {
    backgroundColor: '#0084ff',
    paddingVertical: 16,
    alignItems: 'center',
    zIndex: 5,
  },
  headerText: { color: '#fff', fontSize: 20, fontWeight: '600' },

  container: { flex: 1 },
  chatContainer: { padding: 16, paddingTop: 80 }, // leave space under banner

  bubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleLeft: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0,
  },
  bubbleRight: {
    backgroundColor: '#dcf8c6',
    alignSelf: 'flex-end',
    borderTopRightRadius: 0,
  },
  bubbleText: { fontSize: 16, lineHeight: 22, color: '#333' },

  inputBar: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  input: { flex: 1, padding: 10, fontSize: 16 },
  sendButton: {
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  sendText: { color: '#0084ff', fontSize: 16, fontWeight: '600' },
});
