import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

// Translation cache to minimize API calls
interface TranslationCache {
  [key: string]: {
    [key: string]: string;
  };
}

const translationCache: TranslationCache = {
  'bn': {
    // Pre-filled common translations for Bengali
    // Service/Requirement Titles
    'Cook': 'রাঁধুনি',
    'Housemaid': 'গৃহপরিচারিকা',
    'Career Counseling Services': 'ক্যারিয়ার কাউন্সেলিং সেবা',
    'Science Tutor for School Students': 'স্কুল ছাত্রদের জন্য বিজ্ঞান শিক্ষক',
    'Computer Programming Coach': 'কম্পিউটার প্রোগ্রামিং কোচ',
    'English Language Teacher': 'ইংরেজি ভাষা শিক্ষক',
    'Mathematics Tutor': 'গণিত শিক্ষক',
    'Warehouse Stock Manager': 'গুদাম স্টক ম্যানেজার',
    'Electrical Repairs and Installation': 'বৈদ্যুতিক মেরামত এবং ইনস্টলেশন',
    'Irrigation System Installation': 'সেচ ব্যবস্থা ইনস্টলেশন',
    'Grocery Store Shelf Stocker': 'মুদি দোকানের তাক স্টকার',
    'Makeup Artist for Events': 'অনুষ্ঠানের জন্য মেকআপ আর্টিস্ট',
    'Medical Lab Technician': 'মেডিকেল ল্যাব টেকনিশিয়ান',
    'Carpentry and Furniture Repair': 'কাঠমিস্ত্রি এবং আসবাবপত্র মেরামত',
    'Pesticide Application Service': 'কীটনাশক প্রয়োগ সেবা',
    'Pharmacy Assistant': 'ফার্মেসি সহকারী',
    'Manicure and Pedicure Service': 'ম্যানিকিউর এবং পেডিকিউর সেবা',
    'Sales Associate for Clothing Store': 'পোশাক দোকানের জন্য বিক্রয় সহযোগী',
    'Farm Equipment Operator': 'কৃষি যন্ত্রপাতি অপারেটর',
    'Cooking and Meal Preparation': 'রান্না এবং খাবার প্রস্তুতি',
    'Home Nursing Care': 'হোম নার্সিং কেয়ার',
    'Hair Styling and Cutting': 'চুল স্টাইলিং এবং কাটিং',
    'Cashier for Retail Store': 'খুচরা দোকানের ক্যাশিয়ার',
    'Crop Harvesting Help': 'ফসল কাটার সাহায্য',
    'Plumbing Services': 'প্লাম্বিং সেবা',
    'Garden Maintenance': 'বাগান রক্ষণাবেক্ষণ',
    'House Cleaning Service': 'বাড়ি পরিষ্কারের সেবা',
    
    // Categories
    'Education Services': 'শিক্ষা সেবা',
    'Household Work': 'গৃহস্থালি কাজ',
    'Agriculture': 'কৃষি',
    'Shop Staff': 'দোকানের কর্মী',
    'Salon Service': 'সেলুন সেবা',
    'Medical Staff': 'মেডিকেল স্টাফ',
    
    // Cities
    'Hyderabad': 'হায়দরাবাদ',
    'Chennai': 'চেন্নাই',
    'Bangalore': 'বেঙ্গালুরু',
    'Mumbai': 'মুম্বাই',
    'Delhi': 'দিল্লি',
    'Guwahati': 'গুয়াহাটি',
    'Surat': 'সুরাট',
    
    // States
    'Telangana': 'তেলেঙ্গানা',
    'Tamil Nadu': 'তামিলনাড়ু',
    'Karnataka': 'কর্ণাটক',
    'Maharashtra': 'মহারাষ্ট্র',
    'Delhi State': 'দিল্লি রাজ্য',
    'Assam': 'আসাম',
    'Gujarat': 'গুজরাট'
  },
  'pa': {
    // Pre-filled common translations for Punjabi
    // Service/Requirement Titles
    'Cook': 'ਰਸੋਈਆ',
    'Housemaid': 'ਘਰੇਲੂ ਨੌਕਰਾਨੀ',
    'Career Counseling Services': 'ਕਰੀਅਰ ਕਾਉਂਸਲਿੰਗ ਸੇਵਾਵਾਂ',
    'Science Tutor for School Students': 'ਸਕੂਲ ਵਿਦਿਆਰਥੀਆਂ ਲਈ ਵਿਗਿਆਨ ਅਧਿਆਪਕ',
    'Computer Programming Coach': 'ਕੰਪਿਊਟਰ ਪ੍ਰੋਗਰਾਮਿੰਗ ਕੋਚ',
    'English Language Teacher': 'ਅੰਗਰੇਜ਼ੀ ਭਾਸ਼ਾ ਅਧਿਆਪਕ',
    'Mathematics Tutor': 'ਗਣਿਤ ਅਧਿਆਪਕ',
    'Warehouse Stock Manager': 'ਵੇਅਰਹਾਊਸ ਸਟਾਕ ਮੈਨੇਜਰ',
    'Electrical Repairs and Installation': 'ਇਲੈਕਟ੍ਰੀਕਲ ਮੁਰੰਮਤ ਅਤੇ ਸਥਾਪਨਾ',
    'Irrigation System Installation': 'ਸਿੰਚਾਈ ਪ੍ਰਣਾਲੀ ਸਥਾਪਨਾ',
    'Grocery Store Shelf Stocker': 'ਕਰਿਆਨਾ ਸਟੋਰ ਸ਼ੈਲਫ ਸਟੌਕਰ',
    'Makeup Artist for Events': 'ਸਮਾਗਮਾਂ ਲਈ ਮੇਕਅਪ ਆਰਟਿਸਟ',
    'Medical Lab Technician': 'ਮੈਡੀਕਲ ਲੈਬ ਟੈਕਨੀਸ਼ੀਅਨ',
    'Carpentry and Furniture Repair': 'ਤਰਖਾਣਾ ਅਤੇ ਫਰਨੀਚਰ ਮੁਰੰਮਤ',
    'Pesticide Application Service': 'ਕੀਟਨਾਸ਼ਕ ਐਪਲੀਕੇਸ਼ਨ ਸੇਵਾ',
    'Pharmacy Assistant': 'ਫਾਰਮੇਸੀ ਸਹਾਇਕ',
    'Manicure and Pedicure Service': 'ਮੈਨੀਕਿਓਰ ਅਤੇ ਪੈਡੀਕਿਓਰ ਸੇਵਾ',
    'Sales Associate for Clothing Store': 'ਕੱਪੜੇ ਦੀ ਦੁਕਾਨ ਲਈ ਸੇਲਜ਼ ਐਸੋਸੀਏਟ',
    'Farm Equipment Operator': 'ਖੇਤੀਬਾੜੀ ਉਪਕਰਣ ਓਪਰੇਟਰ',
    'Cooking and Meal Preparation': 'ਖਾਣਾ ਪਕਾਉਣ ਅਤੇ ਭੋਜਨ ਤਿਆਰੀ',
    'Home Nursing Care': 'ਘਰ ਨਰਸਿੰਗ ਦੇਖਭਾਲ',
    'Hair Styling and Cutting': 'ਵਾਲ ਸਟਾਈਲਿੰਗ ਅਤੇ ਕਟਿੰਗ',
    'Cashier for Retail Store': 'ਰਿਟੇਲ ਸਟੋਰ ਲਈ ਕੈਸ਼ੀਅਰ',
    'Crop Harvesting Help': 'ਫਸਲ ਵਾਢੀ ਸਹਾਇਤਾ',
    'Plumbing Services': 'ਪਲੰਬਿੰਗ ਸੇਵਾਵਾਂ',
    'Garden Maintenance': 'ਬਾਗ ਰੱਖ-ਰਖਾਅ',
    'House Cleaning Service': 'ਘਰ ਦੀ ਸਫਾਈ ਸੇਵਾ',
    
    // Categories
    'Education Services': 'ਸਿੱਖਿਆ ਸੇਵਾਵਾਂ',
    'Household Work': 'ਘਰੇਲੂ ਕੰਮ',
    'Agriculture': 'ਖੇਤੀਬਾੜੀ',
    'Shop Staff': 'ਦੁਕਾਨ ਸਟਾਫ',
    'Salon Service': 'ਸੈਲੂਨ ਸੇਵਾ',
    'Medical Staff': 'ਮੈਡੀਕਲ ਸਟਾਫ',
    
    // Cities
    'Hyderabad': 'ਹੈਦਰਾਬਾਦ',
    'Chennai': 'ਚੇਨਈ',
    'Bangalore': 'ਬੈਂਗਲੁਰੂ',
    'Mumbai': 'ਮੁੰਬਈ',
    'Delhi': 'ਦਿੱਲੀ',
    'Guwahati': 'ਗੁਵਾਹਾਟੀ',
    'Surat': 'ਸੂਰਤ',
    
    // States
    'Telangana': 'ਤੇਲੰਗਾਨਾ',
    'Tamil Nadu': 'ਤਾਮਿਲ ਨਾਡੂ',
    'Karnataka': 'ਕਰਨਾਟਕ',
    'Maharashtra': 'ਮਹਾਰਾਸ਼ਟਰ',
    'Delhi State': 'ਦਿੱਲੀ ਰਾਜ',
    'Assam': 'ਅਸਾਮ',
    'Gujarat': 'ਗੁਜਰਾਤ'
  },
  'hi': {
    // Pre-filled common translations for Hindi
    // Service/Requirement Titles
    'Cook': 'रसोइया',
    'Housemaid': 'घरेलू नौकरानी',
    'Career Counseling Services': 'करियर परामर्श सेवाएं',
    'Science Tutor for School Students': 'स्कूली छात्रों के लिए विज्ञान शिक्षक',
    'Computer Programming Coach': 'कंप्यूटर प्रोग्रामिंग कोच',
    'English Language Teacher': 'अंग्रेजी भाषा शिक्षक',
    'Mathematics Tutor': 'गणित शिक्षक',
    'Warehouse Stock Manager': 'गोदाम स्टॉक प्रबंधक',
    'Electrical Repairs and Installation': 'बिजली की मरम्मत और स्थापना',
    'Irrigation System Installation': 'सिंचाई प्रणाली स्थापना',
    'Grocery Store Shelf Stocker': 'किराना स्टोर शेल्फ स्टॉकर',
    'Makeup Artist for Events': 'कार्यक्रमों के लिए मेकअप आर्टिस्ट',
    'Medical Lab Technician': 'मेडिकल लैब टेक्नीशियन',
    'Carpentry and Furniture Repair': 'बढ़ईगीरी और फर्नीचर मरम्मत',
    'Pesticide Application Service': 'कीटनाशक अनुप्रयोग सेवा',
    'Pharmacy Assistant': 'फार्मेसी सहायक',
    'Manicure and Pedicure Service': 'मैनीक्योर और पेडीक्योर सेवा',
    'Sales Associate for Clothing Store': 'कपड़ा स्टोर के लिए सेल्स एसोसिएट',
    'Farm Equipment Operator': 'कृषि उपकरण ऑपरेटर',
    'Cooking and Meal Preparation': 'खाना पकाना और भोजन तैयारी',
    'Home Nursing Care': 'घर नर्सिंग देखभाल',
    'Hair Styling and Cutting': 'बाल स्टाइलिंग और कटिंग',
    'Cashier for Retail Store': 'रिटेल स्टोर के लिए कैशियर',
    'Crop Harvesting Help': 'फसल कटाई सहायता',
    'Plumbing Services': 'प्लंबिंग सेवाएं',
    'Garden Maintenance': 'बगीचा रखरखाव',
    'House Cleaning Service': 'घर की सफाई सेवा',
    
    // Categories
    'Education Services': 'शिक्षा सेवाएं',
    'Household Work': 'घरेलू काम',
    'Agriculture': 'कृषि',
    'Shop Staff': 'दुकान कर्मचारी',
    'Salon Service': 'सैलून सेवा',
    'Medical Staff': 'चिकित्सा कर्मचारी',
    
    // Cities
    'Hyderabad': 'हैदराबाद',
    'Chennai': 'चेन्नई',
    'Bangalore': 'बैंगलोर',
    'Mumbai': 'मुंबई',
    'Delhi': 'दिल्ली',
    'Guwahati': 'गुवाहाटी',
    'Surat': 'सूरत',
    
    // States
    'Telangana': 'तेलंगाना',
    'Tamil Nadu': 'तमिलनाडु',
    'Karnataka': 'कर्नाटक',
    'Maharashtra': 'महाराष्ट्र',
    'Delhi State': 'दिल्ली राज्य',
    'Assam': 'असम',
    'Gujarat': 'गुजरात'
  },
  'ta': {
    // Pre-filled common translations for Tamil
    // Service/Requirement Titles
    'Cook': 'சமையல்காரர்',
    'Housemaid': 'வீட்டு வேலைக்காரி',
    'Career Counseling Services': 'தொழில் ஆலோசனை சேவைகள்',
    'Science Tutor for School Students': 'பள்ளி மாணவர்களுக்கான அறிவியல் ஆசிரியர்',
    'Computer Programming Coach': 'கணினி நிரலாக்க பயிற்சியாளர்',
    'English Language Teacher': 'ஆங்கில மொழி ஆசிரியர்',
    'Mathematics Tutor': 'கணித ஆசிரியர்',
    'Warehouse Stock Manager': 'கிடங்கு பொருட்கள் மேலாளர்',
    'Electrical Repairs and Installation': 'மின்சார பழுதுபார்ப்பு மற்றும் நிறுவல்',
    'Irrigation System Installation': 'நீர்ப்பாசன அமைப்பு நிறுவல்',
    'Grocery Store Shelf Stocker': 'மளிகை கடை அலமாரி ஸ்டாக்கர்',
    'Makeup Artist for Events': 'நிகழ்வுகளுக்கான மேக்கப் கலைஞர்',
    'Medical Lab Technician': 'மருத்துவ ஆய்வக தொழில்நுட்பவியலாளர்',
    'Carpentry and Furniture Repair': 'தச்சுவேலை மற்றும் மரத்தளபாட பழுதுபார்ப்பு',
    'Pesticide Application Service': 'பூச்சிக்கொல்லி பயன்பாட்டு சேவை',
    'Pharmacy Assistant': 'மருந்தகம் உதவியாளர்',
    'Manicure and Pedicure Service': 'மணிக்கியூர் மற்றும் பெடிக்கியூர் சேவை',
    'Sales Associate for Clothing Store': 'ஆடை கடைக்கான விற்பனை துணையாளர்',
    'Farm Equipment Operator': 'பண்ணை உபகரண இயக்குபவர்',
    'Cooking and Meal Preparation': 'சமையல் மற்றும் உணவு தயாரிப்பு',
    'Home Nursing Care': 'வீட்டு செவிலி பராமரிப்பு',
    'Hair Styling and Cutting': 'முடி அலங்காரம் மற்றும் வெட்டுதல்',
    'Cashier for Retail Store': 'சில்லறை கடைக்கான காசாளர்',
    'Crop Harvesting Help': 'பயிர் அறுவடை உதவி',
    'Plumbing Services': 'குழாய் பொருத்துதல் சேவைகள்',
    'Garden Maintenance': 'தோட்ட பராமரிப்பு',
    'House Cleaning Service': 'வீடு சுத்தம் செய்யும் சேவை',
    
    // Categories
    'Education Services': 'கல்வி சேவைகள்',
    'Household Work': 'வீட்டு வேலை',
    'Agriculture': 'விவசாயம்',
    'Shop Staff': 'கடை ஊழியர்',
    'Salon Service': 'அழகு நிலைய சேவை',
    'Medical Staff': 'மருத்துவ ஊழியர்',
    
    // Cities
    'Hyderabad': 'ஹைதராபாத்',
    'Chennai': 'சென்னை',
    'Bangalore': 'பெங்களூரு',
    'Mumbai': 'மும்பை',
    'Delhi': 'டெல்லி',
    'Guwahati': 'குவஹாத்தி',
    'Surat': 'சூரத்',
    
    // States
    'Telangana': 'தெலுங்கானா',
    'Tamil Nadu': 'தமிழ்நாடு',
    'Karnataka': 'கர்நாடகா',
    'Maharashtra': 'மகாராஷ்டிரா',
    'Delhi State': 'டெல்லி மாநிலம்',
    'Assam': 'அசாம்',
    'Gujarat': 'குஜராத்'
  },
  'gu': {
    // Comprehensive translations for Gujarati
    // Categories
    'Education Services': 'શિક્ષણ સેવાઓ',
    'Household Work': 'ઘરકામ',
    'Agriculture': 'કૃષિ',
    'Shop Staff': 'દુકાન કર્મચારી',
    'Salon Service': 'સલૂન સેવા',
    'Medical Staff': 'તબીબી કર્મચારી',
    
    // Common service titles
    'Cook': 'રસોઈયા',
    'Housemaid': 'ઘરકામ કરનાર',
    'Career Counseling Services': 'કારકિર્દી માર્ગદર્શન સેવાઓ',
    'Science Tutor for School Students': 'શાળાના વિદ્યાર્થીઓ માટે વિજ્ઞાન ટ્યુટર',
    'Computer Programming Coach': 'કમ્પ્યુટર પ્રોગ્રામિંગ કોચ',
    'English Language Teacher': 'અંગ્રેજી ભાષા શિક્ષક',
    'Mathematics Tutor': 'ગણિત શિક્ષક',
    'Warehouse Stock Manager': 'ગોદામ સ્ટોક મેનેજર',
    'Electrical Repairs and Installation': 'ઇલેક્ટ્રિકલ રિપેર અને ઇન્સ્ટોલેશન',
    'Irrigation System Installation': 'સિંચાઈ સિસ્ટમ ઇન્સ્ટોલેશન',
    'Grocery Store Shelf Stocker': 'કરિયાણા સ્ટોર શેલ્ફ સ્ટોકર',
    'Makeup Artist for Events': 'ઇવેન્ટ્સ માટે મેકઅપ આર્ટિસ્ટ',
    'Medical Lab Technician': 'મેડિકલ લેબ ટેકનિશિયન',
    'Carpentry and Furniture Repair': 'સુથારીકામ અને ફર્નિચર રિપેરિંગ',
    'Pesticide Application Service': 'જંતુનાશક છંટકાવ સેવા',
    'Pharmacy Assistant': 'ફાર્મસી આસિસ્ટન્ટ',
    'Manicure and Pedicure Service': 'મેનિક્યોર અને પેડિક્યોર સેવા',
    'Sales Associate for Clothing Store': 'કપડાં દુકાન માટે સેલ્સ એસોસિએટ',
    'Farm Equipment Operator': 'ખેતી સાધનોના ઓપરેટર',
    'Cooking and Meal Preparation': 'રસોઈ અને ભોજન તૈયારી',
    'Home Nursing Care': 'ઘરમાં નર્સિંગ સંભાળ',
    'Hair Styling and Cutting': 'હેર સ્ટાઇલિંગ અને કટિંગ',
    'Cashier for Retail Store': 'રિટેલ સ્ટોર માટે કેશિયર',
    'Crop Harvesting Help': 'પાક લણણીમાં મદદ',
    'Plumbing Services': 'પ્લમ્બિંગ સેવાઓ',
    'Garden Maintenance': 'બગીચાની જાળવણી',
    'House Cleaning Service': 'ઘર સફાઈ સેવા',
    
    // Common cities
    'Delhi': 'દિલ્હી',
    'Mumbai': 'મુંબઈ',
    'Ahmedabad': 'અમદાવાદ',
    'Surat': 'સુરત',
    'Hyderabad': 'હૈદરાબાદ',
    'Chennai': 'ચેન્નાઈ',
    'Bangalore': 'બેંગલુરુ',
    'Kolkata': 'કોલકાતા',
    'Pune': 'પૂણે',
    
    // Common states
    'Gujarat': 'ગુજરાત',
    'Maharashtra': 'મહારાષ્ટ્ર',
    'Delhi State': 'દિલ્હી રાજ્ય',
    'Telangana': 'તેલંગાણા',
    'Tamil Nadu': 'તમિલનાડુ',
    'Karnataka': 'કર્ણાટક',
    'West Bengal': 'પશ્ચિમ બંગાળ',
    'Assam': 'આસામ',
    
    // Common UI strings
    'Contact': 'સંપર્ક કરો',
    'Select': 'પસંદ કરો',
    'Posted': 'પોસ્ટ કરેલ',
    'Remote Allowed': 'રિમોટ મંજૂર',
    'In-person Only': 'માત્ર રૂબરૂ',
    'open': 'ખુલ્લું',
    'closed': 'બંધ',
    'Services': 'સેવાઓ',
    'Requirements': 'જરૂરિયાતો'
  },
  'kn': {
    // Comprehensive translations for Kannada
    // Categories
    'Education Services': 'ಶಿಕ್ಷಣ ಸೇವೆಗಳು',
    'Household Work': 'ಮನೆಕೆಲಸ',
    'Agriculture': 'ಕೃಷಿ',
    'Shop Staff': 'ಅಂಗಡಿ ಸಿಬ್ಬಂದಿ',
    'Salon Service': 'ಸಲೂನ್ ಸೇವೆ',
    'Medical Staff': 'ವೈದ್ಯಕೀಯ ಸಿಬ್ಬಂದಿ',
    
    // Common service titles
    'Cook': 'ಅಡುಗೆಯವರು',
    'Housemaid': 'ಮನೆಕೆಲಸದ ಮಹಿಳೆ',
    'Career Counseling Services': 'ವೃತ್ತಿ ಸಲಹಾ ಸೇವೆಗಳು',
    'Science Tutor for School Students': 'ಶಾಲಾ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ವಿಜ್ಞಾನ ಟ್ಯೂಟರ್',
    'Computer Programming Coach': 'ಕಂಪ್ಯೂಟರ್ ಪ್ರೋಗ್ರಾಮಿಂಗ್ ಕೋಚ್',
    'English Language Teacher': 'ಇಂಗ್ಲಿಷ್ ಭಾಷಾ ಶಿಕ್ಷಕ',
    'Mathematics Tutor': 'ಗಣಿತ ಟ್ಯೂಟರ್',
    'Warehouse Stock Manager': 'ವೇರ್‌ಹೌಸ್ ಸ್ಟಾಕ್ ಮ್ಯಾನೇಜರ್',
    'Electrical Repairs and Installation': 'ವಿದ್ಯುತ್ ದುರಸ್ತಿ ಮತ್ತು ಸ್ಥಾಪನೆ',
    'Irrigation System Installation': 'ನೀರಾವರಿ ವ್ಯವಸ್ಥೆ ಸ್ಥಾಪನೆ',
    'Grocery Store Shelf Stocker': 'ಕಿರಾಣಿ ಅಂಗಡಿ ಶೆಲ್ಫ್ ಸ್ಟಾಕರ್',
    'Makeup Artist for Events': 'ಕಾರ್ಯಕ್ರಮಗಳಿಗೆ ಮೇಕಪ್ ಕಲಾವಿದರು',
    'Medical Lab Technician': 'ವೈದ್ಯಕೀಯ ಲ್ಯಾಬ್ ತಂತ್ರಜ್ಞ',
    'Carpentry and Furniture Repair': 'ಬಡಗಿತನ ಮತ್ತು ಫರ್ನಿಚರ್ ದುರಸ್ತಿ',
    'Pesticide Application Service': 'ಕೀಟನಾಶಕ ಸಿಂಪಡಣೆಯ ಸೇವೆ',
    'Pharmacy Assistant': 'ಫಾರ್ಮಸಿ ಸಹಾಯಕ',
    'Manicure and Pedicure Service': 'ಮಾನಿಕ್ಯೂರ್ ಮತ್ತು ಪೆಡಿಕ್ಯೂರ್ ಸೇವೆ',
    'Sales Associate for Clothing Store': 'ಬಟ್ಟೆ ಅಂಗಡಿಗೆ ಮಾರಾಟ ಸಹಾಯಕ',
    'Farm Equipment Operator': 'ಕೃಷಿ ಉಪಕರಣ ಆಪರೇಟರ್',
    'Cooking and Meal Preparation': 'ಅಡುಗೆ ಮತ್ತು ಊಟದ ತಯಾರಿಕೆ',
    'Home Nursing Care': 'ಮನೆಯಲ್ಲಿ ನರ್ಸಿಂಗ್ ಆರೈಕೆ',
    'Hair Styling and Cutting': 'ಕೂದಲು ಶೈಲಿ ಮತ್ತು ಕಟಿಂಗ್',
    'Cashier for Retail Store': 'ರಿಟೇಲ್ ಸ್ಟೋರ್‌ಗೆ ಕ್ಯಾಷಿಯರ್',
    'Crop Harvesting Help': 'ಬೆಳೆ ಕೊಯ್ಲು ಸಹಾಯ',
    'Plumbing Services': 'ಪ್ಲಂಬಿಂಗ್ ಸೇವೆಗಳು',
    'Garden Maintenance': 'ತೋಟದ ನಿರ್ವಹಣೆ',
    'House Cleaning Service': 'ಮನೆ ಸ್ವಚ್ಛ ಮಾಡುವ ಸೇವೆ',
    
    // Common cities
    'Bangalore': 'ಬೆಂಗಳೂರು',
    'Mysore': 'ಮೈಸೂರು',
    'Delhi': 'ದೆಹಲಿ',
    'Mumbai': 'ಮುಂಬೈ',
    'Chennai': 'ಚೆನ್ನೈ',
    'Kolkata': 'ಕೋಲ್ಕತ್ತಾ',
    'Hyderabad': 'ಹೈದರಾಬಾದ್',
    'Mangalore': 'ಮಂಗಳೂರು',
    'Hubli': 'ಹುಬ್ಬಳ್ಳಿ',
    
    // Common states
    'Karnataka': 'ಕರ್ನಾಟಕ',
    'Tamil Nadu': 'ತಮಿಳುನಾಡು',
    'Telangana': 'ತೆಲಂಗಾಣ',
    'Maharashtra': 'ಮಹಾರಾಷ್ಟ್ರ',
    'Delhi State': 'ದೆಹಲಿ ರಾಜ್ಯ',
    'West Bengal': 'ಪಶ್ಚಿಮ ಬಂಗಾಳ',
    
    // Common UI strings
    'Contact': 'ಸಂಪರ್ಕಿಸಿ',
    'Select': 'ಆಯ್ಕೆಮಾಡಿ',
    'Posted': 'ಪೋಸ್ಟ್ ಮಾಡಲಾಗಿದೆ',
    'Remote Allowed': 'ರಿಮೋಟ್ ಅನುಮತಿಸಲಾಗಿದೆ',
    'In-person Only': 'ವ್ಯಕ್ತಿಯಾಗಿ ಮಾತ್ರ',
    'open': 'ತೆರೆದಿದೆ',
    'closed': 'ಮುಚ್ಚಲಾಗಿದೆ',
    'Services': 'ಸೇವೆಗಳು',
    'Requirements': 'ಅವಶ್ಯಕತೆಗಳು'
  },
  'ml': {
    // Comprehensive translations for Malayalam
    // Categories
    'Education Services': 'വിദ്യാഭ്യാസ സേവനങ്ങൾ',
    'Household Work': 'വീട്ടുജോലി',
    'Agriculture': 'കൃഷി',
    'Shop Staff': 'കട ജീവനക്കാർ',
    'Salon Service': 'സലൂൺ സേവനം',
    'Medical Staff': 'മെഡിക്കൽ സ്റ്റാഫ്',
    
    // Common service titles
    'Cook': 'പാചകക്കാരൻ',
    'Housemaid': 'വീട്ടുജോലിക്കാരി',
    'Career Counseling Services': 'കരിയർ കൗൺസിലിംഗ് സേവനങ്ങൾ',
    'Science Tutor for School Students': 'സ്കൂൾ വിദ്യാർത്ഥികൾക്കായുള്ള ശാസ്ത്ര ട്യൂട്ടർ',
    'Computer Programming Coach': 'കമ്പ്യൂട്ടർ പ്രോഗ്രാമിംഗ് കോച്ച്',
    'English Language Teacher': 'ഇംഗ്ലീഷ് ഭാഷാ അധ്യാപകൻ',
    'Mathematics Tutor': 'ഗണിത ട്യൂട്ടർ',
    'Warehouse Stock Manager': 'വെയർഹൗസ് സ്റ്റോക്ക് മാനേജർ',
    'Electrical Repairs and Installation': 'ഇലക്ട്രിക്കൽ റിപ്പയറുകളും ഇൻസ്റ്റാളേഷനും',
    'Irrigation System Installation': 'ജലസേചന സംവിധാന ഇൻസ്റ്റലേഷൻ',
    'Grocery Store Shelf Stocker': 'പലചരക്ക് കട ഷെൽഫ് സ്റ്റോക്കർ',
    'Makeup Artist for Events': 'ഇവന്റുകൾക്കായുള്ള മേക്കപ്പ് ആർട്ടിസ്റ്റ്',
    'Medical Lab Technician': 'മെഡിക്കൽ ലാബ് ടെക്നീഷ്യൻ',
    'Carpentry and Furniture Repair': 'ആശാരിപ്പണിയും ഫർണിച്ചർ അറ്റകുറ്റപ്പണികളും',
    'Pesticide Application Service': 'കീടനാശിനി പ്രയോഗ സേവനം',
    'Pharmacy Assistant': 'ഫാർമസി അസിസ്റ്റന്റ്',
    'Manicure and Pedicure Service': 'മാനിക്യൂർ, പെഡിക്യൂർ സേവനം',
    'Sales Associate for Clothing Store': 'വസ്ത്ര കടയ്ക്കായുള്ള സെയിൽസ് അസോസിയേറ്റ്',
    'Farm Equipment Operator': 'കാർഷിക ഉപകരണങ്ങളുടെ ഓപ്പറേറ്റർ',
    'Cooking and Meal Preparation': 'പാചകവും ഭക്ഷണം തയ്യാറാക്കലും',
    'Home Nursing Care': 'ഹോം നഴ്സിംഗ് കെയർ',
    'Hair Styling and Cutting': 'മുടി സ്റ്റൈലിംഗും കട്ടിംഗും',
    'Cashier for Retail Store': 'റീട്ടെയിൽ സ്റ്റോറിനായുള്ള ക്യാഷ്യർ',
    'Crop Harvesting Help': 'വിളവെടുപ്പ് സഹായം',
    'Plumbing Services': 'പ്ലംബിംഗ് സേവനങ്ങൾ',
    'Garden Maintenance': 'തോട്ടം പരിപാലനം',
    'House Cleaning Service': 'വീട് വൃത്തിയാക്കൽ സേവനം',
    
    // Common cities
    'Kochi': 'കൊച്ചി',
    'Thiruvananthapuram': 'തിരുവനന്തപുരം',
    'Delhi': 'ഡൽഹി',
    'Mumbai': 'മുംബൈ',
    'Chennai': 'ചെന്നൈ',
    'Bangalore': 'ബെംഗളൂരു',
    'Kolkata': 'കൊൽക്കത്ത',
    'Kozhikode': 'കോഴിക്കോട്',
    'Thrissur': 'തൃശ്ശൂർ',
    
    // Common states
    'Kerala': 'കേരളം',
    'Tamil Nadu': 'തമിഴ്‌നാട്',
    'Karnataka': 'കർണാടക',
    'Maharashtra': 'മഹാരാഷ്ട്ര',
    'Delhi State': 'ഡൽഹി സംസ്ഥാനം',
    'West Bengal': 'പശ്ചിമ ബംഗാൾ',
    
    // Common UI strings
    'Contact': 'ബന്ധപ്പെടുക',
    'Select': 'തിരഞ്ഞെടുക്കുക',
    'Posted': 'പോസ്റ്റ് ചെയ്തത്',
    'Remote Allowed': 'റിമോട്ട് അനുവദനീയം',
    'In-person Only': 'നേരിട്ട് മാത്രം',
    'open': 'തുറന്നിരിക്കുന്നു',
    'closed': 'അടച്ചിരിക്കുന്നു',
    'Services': 'സേവനങ്ങൾ',
    'Requirements': 'ആവശ്യങ്ങൾ'
  },
  'te': {
    // Comprehensive translations for Telugu
    // Categories
    'Education Services': 'విద్యా సేవలు',
    'Household Work': 'గృహ పని',
    'Agriculture': 'వ్యవసాయం',
    'Shop Staff': 'షాప్ సిబ్బంది',
    'Salon Service': 'సలూన్ సర్వీస్',
    'Medical Staff': 'వైద్య సిబ్బంది',
    
    // Common service titles
    'Cook': 'వంటవాడు',
    'Housemaid': 'గృహ పరిచారిక',
    'Career Counseling Services': 'కెరీర్ కౌన్సెలింగ్ సేవలు',
    'Science Tutor for School Students': 'పాఠశాల విద్యార్థుల కోసం సైన్స్ ట్యూటర్',
    'Computer Programming Coach': 'కంప్యూటర్ ప్రోగ్రామింగ్ కోచ్',
    'English Language Teacher': 'ఇంగ్లీష్ భాషా ఉపాధ్యాయుడు',
    'Mathematics Tutor': 'గణిత ట్యూటర్',
    'Warehouse Stock Manager': 'వేర్‌హౌస్ స్టాక్ మేనేజర్',
    'Electrical Repairs and Installation': 'విద్యుత్ మరమ్మతులు మరియు స్థాపన',
    'Irrigation System Installation': 'నీటిపారుదల వ్యవస్థ స్థాపన',
    'Grocery Store Shelf Stocker': 'కిరాణా స్టోర్ షెల్ఫ్ స్టాకర్',
    'Makeup Artist for Events': 'ఈవెంట్‌ల కోసం మేకప్ ఆర్టిస్ట్',
    'Medical Lab Technician': 'మెడికల్ ల్యాబ్ టెక్నీషియన్',
    'Carpentry and Furniture Repair': 'వడ్రంగం మరియు ఫర్నిచర్ మరమ్మతు',
    'Pesticide Application Service': 'పురుగుమందుల అప్లికేషన్ సేవ',
    'Pharmacy Assistant': 'ఫార్మసీ అసిస్టెంట్',
    'Manicure and Pedicure Service': 'మానిక్యూర్ మరియు పెడిక్యూర్ సేవ',
    'Sales Associate for Clothing Store': 'దుస్తుల స్టోర్ కోసం సేల్స్ అసోసియేట్',
    'Farm Equipment Operator': 'వ్యవసాయ పరికరాల ఆపరేటర్',
    'Cooking and Meal Preparation': 'వంట మరియు భోజనం తయారీ',
    'Home Nursing Care': 'హోమ్ నర్సింగ్ కేర్',
    'Hair Styling and Cutting': 'హెయిర్ స్టైలింగ్ మరియు కటింగ్',
    'Cashier for Retail Store': 'రిటైల్ స్టోర్ కోసం క్యాషియర్',
    'Crop Harvesting Help': 'పంట కోత సాయం',
    'Plumbing Services': 'ప్లంబింగ్ సేవలు',
    'Garden Maintenance': 'తోట నిర్వహణ',
    'House Cleaning Service': 'ఇంటి శుభ్రపరచే సేవ',
    
    // Common cities
    'Hyderabad': 'హైదరాబాద్',
    'Vijayawada': 'విజయవాడ',
    'Delhi': 'ఢిల్లీ',
    'Mumbai': 'ముంబై',
    'Chennai': 'చెన్నై',
    'Bangalore': 'బెంగళూరు',
    'Kolkata': 'కోల్‌కతా',
    'Pune': 'పూణే',
    'Visakhapatnam': 'విశాఖపట్నం',
    
    // Common states
    'Telangana': 'తెలంగాణ',
    'Andhra Pradesh': 'ఆంధ్ర ప్రదేశ్',
    'Tamil Nadu': 'తమిళనాడు',
    'Karnataka': 'కర్ణాటక',
    'Maharashtra': 'మహారాష్ట్ర',
    'Delhi State': 'ఢిల్లీ రాష్ట్రం',
    
    // Common UI strings
    'Contact': 'సంప్రదించండి',
    'Select': 'ఎంచుకోండి',
    'Posted': 'పోస్ట్ చేయబడింది',
    'Remote Allowed': 'రిమోట్ అనుమతించబడింది',
    'In-person Only': 'వ్యక్తిగతంగా మాత్రమే',
    'open': 'తెరిచి ఉంది',
    'closed': 'మూసివేయబడింది',
    'Services': 'సేవలు',
    'Requirements': 'అవసరాలు'
  },
  'mr': {
    // Basic initial structure for Marathi translations
    // Categories
    'Education Services': 'शिक्षण सेवा',
    'Household Work': 'घरगुती काम',
    'Agriculture': 'शेती',
    'Shop Staff': 'दुकान कर्मचारी',
    'Salon Service': 'सलून सेवा',
    'Medical Staff': 'वैद्यकीय कर्मचारी',
    
    // Common cities
    'Mumbai': 'मुंबई',
    'Pune': 'पुणे',
    
    // Common states
    'Maharashtra': 'महाराष्ट्र',
    'Gujarat': 'गुजरात'
  },
  'or': {
    // Comprehensive translations for Odia
    // Categories
    'Education Services': 'ଶିକ୍ଷା ସେବା',
    'Household Work': 'ଘରକାମ',
    'Agriculture': 'କୃଷି',
    'Shop Staff': 'ଦୋକାନ କର୍ମଚାରୀ',
    'Salon Service': 'ସାଲୁନ୍ ସେବା',
    'Medical Staff': 'ଚିକିତ୍ସା କର୍ମଚାରୀ',
    
    // Common service titles
    'Cook': 'ରନ୍ଧନକାରୀ',
    'Housemaid': 'ଘର ମାଇଡ୍',
    'Career Counseling Services': 'କ୍ୟାରିୟର୍ ପରାମର୍ଶ ସେବା',
    'Science Tutor for School Students': 'ସ୍କୁଲ ଛାତ୍ରଙ୍କ ପାଇଁ ବିଜ୍ଞାନ ଶିକ୍ଷକ',
    'Computer Programming Coach': 'କମ୍ପ୍ୟୁଟର ପ୍ରୋଗ୍ରାମିଂ କୋଚ୍',
    'English Language Teacher': 'ଇଂରାଜୀ ଭାଷା ଶିକ୍ଷକ',
    'Mathematics Tutor': 'ଗଣିତ ଶିକ୍ଷକ',
    'Warehouse Stock Manager': 'ଗୋଦାମ ଷ୍ଟକ୍ ମ୍ୟାନେଜର',
    'Electrical Repairs and Installation': 'ବିଦ୍ୟୁତ ମରାମତି ଏବଂ ସଂସ୍ଥାପନ',
    'Irrigation System Installation': 'ଜଳସେଚନ ପ୍ରଣାଳୀ ସଂସ୍ଥାପନ',
    'Grocery Store Shelf Stocker': 'ମୁଦି ଦୋକାନ ସେଲଫ ଷ୍ଟୋକର',
    'Makeup Artist for Events': 'ଅନୁଷ୍ଠାନ ପାଇଁ ମେକଅପ୍ ଆର୍ଟିଷ୍ଟ',
    'Medical Lab Technician': 'ମେଡିକାଲ ଲ୍ୟାବ୍ ଟେକ୍ନିସିଆନ୍',
    'Carpentry and Furniture Repair': 'କାଠ କାମ ଏବଂ ଫର୍ନିଚର ମରାମତି',
    'Pesticide Application Service': 'କୀଟନାଶକ ପ୍ରୟୋଗ ସେବା',
    'Pharmacy Assistant': 'ଫାର୍ମାସୀ ସହାୟକ',
    'Manicure and Pedicure Service': 'ମ୍ୟାନିକ୍ୟୁର ଏବଂ ପେଡିକ୍ୟୁର ସେବା',
    'Sales Associate for Clothing Store': 'ପୋଷାକ ଦୋକାନ ପାଇଁ ବିକ୍ରୟ ଅଧିକାରୀ',
    'Farm Equipment Operator': 'ଫାର୍ମ ଉପକରଣ ଅପରେଟର୍',
    'Cooking and Meal Preparation': 'ରୋଷେଇ ଏବଂ ଖାଦ୍ୟ ପ୍ରସ୍ତୁତି',
    'Home Nursing Care': 'ଘର ନର୍ସିଂ କେୟାର୍',
    'Hair Styling and Cutting': 'ବାଳ ଷ୍ଟାଇଲିଂ ଏବଂ କଟିଂ',
    'Cashier for Retail Store': 'ରିଟେଲ୍ ଷ୍ଟୋର୍ ପାଇଁ କ୍ୟାସିୟର୍',
    'Crop Harvesting Help': 'ଫସଲ ଅମଳ ସହାୟତା',
    'Plumbing Services': 'ପ୍ଲମ୍ବିଂ ସେବା',
    'Garden Maintenance': 'ବଗିଚା ରକ୍ଷଣାବେକ୍ଷଣ',
    'House Cleaning Service': 'ଘର ସଫା ସେବା',
    
    // Common cities
    'Bhubaneswar': 'ଭୁବନେଶ୍ବର',
    'Cuttack': 'କଟକ',
    'Delhi': 'ଦିଲ୍ଲୀ',
    'Mumbai': 'ମୁମ୍ବାଇ',
    'Chennai': 'ଚେନ୍ନାଇ',
    'Bangalore': 'ବାଙ୍ଗାଲୋର',
    'Kolkata': 'କୋଲକାତା',
    'Puri': 'ପୁରୀ',
    'Rourkela': 'ରାଉରକେଲା',
    
    // Common states
    'Odisha': 'ଓଡିଶା',
    'Tamil Nadu': 'ତାମିଲନାଡୁ',
    'Karnataka': 'କର୍ଣ୍ଣାଟକ',
    'Maharashtra': 'ମହାରାଷ୍ଟ୍ର',
    'Delhi State': 'ଦିଲ୍ଲୀ ରାଜ୍ୟ',
    'West Bengal': 'ପଶ୍ଚିମ ବଙ୍ଗ',
    
    // Common UI strings
    'Contact': 'ଯୋଗାଯୋଗ',
    'Select': 'ଚୟନ କରନ୍ତୁ',
    'Posted': 'ପୋଷ୍ଟ ହୋଇଛି',
    'Remote Allowed': 'ରିମୋଟ୍ ଅନୁମତିପ୍ରାପ୍ତ',
    'In-person Only': 'କେବଳ ବ୍ୟକ୍ତିଗତ',
    'open': 'ଖୋଲା',
    'closed': 'ବନ୍ଦ',
    'Services': 'ସେବା',
    'Requirements': 'ଆବଶ୍ୟକତା'
  },
  
  // Adding translation cache for Assamese (as)
  'as': {
    // Categories
    'Education Services': 'শিক্ষা সেৱা',
    'Household Work': 'ঘৰুৱা কাম',
    'Agriculture': 'কৃষি',
    'Shop Staff': 'দোকান কৰ্মচাৰী',
    'Salon Service': 'চেলুন সেৱা',
    'Medical Staff': 'মেডিকেল কৰ্মচাৰী',
    
    // Common service titles
    'Cook': 'ৰন্ধনি',
    'Housemaid': 'গৃহ পৰিচাৰিকা',
    'Career Counseling Services': 'কেৰিয়াৰ পৰামৰ্শ সেৱা',
    'Science Tutor for School Students': 'স্কুলৰ ছাত্ৰ-ছাত্ৰীৰ বাবে বিজ্ঞান শিক্ষক',
    'Computer Programming Coach': 'কম্পিউটাৰ প্ৰোগ্ৰামিং প্ৰশিক্ষক',
    'English Language Teacher': 'ইংৰাজী ভাষাৰ শিক্ষক',
    'Mathematics Tutor': 'গণিত শিক্ষক',
    
    // Common UI strings
    'Contact': 'যোগাযোগ কৰক',
    'Select': 'বাছনি কৰক',
    'Posted': 'পোষ্ট কৰা হৈছে',
    'Remote Allowed': 'দূৰৱৰ্তী অনুমতি দিয়া হৈছে',
    'In-person Only': 'কেৱল ব্যক্তিগতভাৱে',
    'open': 'খোলা',
    'closed': 'বন্ধ'
  },
  
  // Adding translation cache for Konkani (kok)
  'kok': {
    // Categories
    'Education Services': 'शिक्षा सेवा',
    'Household Work': 'घरचें काम',
    'Agriculture': 'शेतकाम',
    'Shop Staff': 'दुकानांतले कर्मचारी',
    'Salon Service': 'सलून सेवा',
    'Medical Staff': 'वैद्यकीय कर्मचारी',
    
    // Common service titles
    'Cook': 'रांदपी',
    'Housemaid': 'घरकाम करपी बायल',
    'Career Counseling Services': 'करियर सल्लागार सेवा',
    'Science Tutor for School Students': 'शाळेच्या विद्यार्थ्यांखातीर विज्ञान शिक्षक',
    'Computer Programming Coach': 'संगणक प्रोग्रामिंग कोच',
    
    // Common UI strings
    'Contact': 'संपर्क करात',
    'Select': 'निवड करात',
    'Posted': 'पोस्ट केला',
    'Remote Allowed': 'रिमोट परवानगी आसा',
    'In-person Only': 'फकत व्यक्तिशः',
    'open': 'उक्तें',
    'closed': 'बंद'
  },
  
  // Adding translation cache for Kashmiri (ks)
  'ks': {
    // Categories
    'Education Services': 'تعلیمی خدمات',
    'Household Work': 'گھریلو کام',
    'Agriculture': 'زراعت',
    'Shop Staff': 'دکان ملازمین',
    'Salon Service': 'سیلون سروس',
    'Medical Staff': 'طبی عملہ',
    
    // Common service titles
    'Cook': 'باورچی',
    'Housemaid': 'گھریلو ملازمہ',
    'Career Counseling Services': 'کیریر کاؤنسلنگ خدمات',
    
    // Common UI strings
    'Contact': 'رابطہ کریں',
    'Select': 'منتخب کریں',
    'Posted': 'پوسٹ کیا گیا',
    'Remote Allowed': 'ریموٹ کی اجازت ہے',
    'In-person Only': 'صرف شخصی طور پر',
    'open': 'کھلا',
    'closed': 'بند'
  },
  
  // Adding translation cache for Sindhi (sd)
  'sd': {
    // Categories
    'Education Services': 'تعليمي خدمتون',
    'Household Work': 'گھريلو ڪم',
    'Agriculture': 'زراعت',
    'Shop Staff': 'دڪان جو عملو',
    'Salon Service': 'سيلون خدمت',
    'Medical Staff': 'طبي عملو',
    
    // Common service titles
    'Cook': 'وڌو',
    'Housemaid': 'گھريلو ملازمہ',
    'Career Counseling Services': 'ڪيريئر ڪائونسلنگ خدمتون',
    
    // Common UI strings
    'Contact': 'رابطو ڪريو',
    'Select': 'چونڊيو',
    'Posted': 'پوسٽ ڪيل',
    'Remote Allowed': 'ريموٽ جي اجازت آھي',
    'In-person Only': 'صرف ذاتي طور تي',
    'open': 'کليل',
    'closed': 'بند'
  },
  
  // Adding translation cache for Manipuri (mni)
  'mni': {
    // Categories
    'Education Services': 'ꯄꯨꯟꯁꯤꯜꯂꯨꯕ ꯁꯦꯚꯥ',
    'Household Work': 'ꯏꯃꯨꯡꯒꯤ ꯊꯕꯛ',
    'Agriculture': 'ꯂꯣꯉ-ꯆꯥꯟꯕ',
    'Shop Staff': 'ꯗꯨꯀꯥꯟ ꯃꯤꯈꯥ',
    'Salon Service': 'ꯁꯦꯜꯂꯨꯟ ꯁꯦꯚꯥ',
    'Medical Staff': 'ꯂꯩꯎꯐꯃ ꯃꯤꯈꯥ',
    
    // Common service titles
    'Cook': 'ꯑꯇꯦꯝꯕ',
    'Housemaid': 'ꯏꯃꯨꯡꯒꯤ ꯆꯥꯀꯔꯥꯅꯤ',
    
    // Common UI strings
    'Contact': 'ꯄꯥꯎꯐꯝ',
    'Select': 'ꯈꯟꯕ',
    'Posted': 'ꯀꯣꯟꯈꯥꯍꯟꯂꯦ',
    'Remote Allowed': 'ꯂꯥꯞꯅꯥ ꯌꯥꯍꯟꯕ',
    'In-person Only': 'ꯃꯁꯥꯅꯥ ꯑꯣꯢꯕ ꯫',
    'open': 'ꯍꯥꯡꯗꯣꯛꯄ',
    'closed': 'ꯂꯣꯟꯕ'
  },
  
  // Adding translation cache for Bodo (brx)
  'brx': {
    // Categories
    'Education Services': 'सोलोंथाय सेवा',
    'Household Work': 'नोगोर मावखौ',
    'Agriculture': 'हा-बुथुम',
    'Shop Staff': 'दुकान मावखुंगिरि',
    'Salon Service': 'सैलन सेवा',
    'Medical Staff': 'बेजि मावखुंगिरि',
    
    // Common service titles
    'Cook': 'जुनजावखुंगिरि',
    'Housemaid': 'नोगोरारि जुनजावखुंगिरि अनजिमा',
    
    // Common UI strings
    'Contact': 'जथाय मोनहोनो',
    'Select': 'बासिख',
    'Posted': 'होनजानाय जादों',
    'Remote Allowed': 'गोजान जायगानि होगौ',
    'In-person Only': 'थाखो आरो थाखो',
    'open': 'खेवना दंमोन',
    'closed': 'बन्द'
  }
};

// Language codes map for LibreTranslate
const languageCodeMap: Record<string, string> = {
  'en': 'en',  // English
  'hi': 'hi',  // Hindi
  'ta': 'ta',  // Tamil
  'bn': 'bn',  // Bengali
  'pa': 'pa',  // Punjabi
  'gu': 'gu',  // Gujarati
  'kn': 'kn',  // Kannada
  'ml': 'ml',  // Malayalam
  'te': 'te',  // Telugu
  'mr': 'mr',  // Marathi
  'or': 'or',  // Oriya
  'as': 'as',  // Assamese
  'kok': 'kok', // Konkani
  'ks': 'ks',  // Kashmiri
  'sd': 'sd',  // Sindhi
  'mni': 'mni', // Manipuri
  'brx': 'brx'  // Bodo
};

/**
 * Translates content based on the current language using a combination of caching and API calls
 */
export function translateContent(text: string | null | undefined, language: string): string {
  if (!text) return '';
  
  // Only try to translate for non-English languages
  if (language === 'en') {
    return text;
  }
  
  // Check if we have a cached translation
  if (translationCache[language]?.[text]) {
    return translationCache[language][text];
  }
  
  // If this language doesn't have a cache object yet, create one
  if (!translationCache[language]) {
    translationCache[language] = {};
  }
  
  // Check if we can find a translation in another language we might have
  // This is just a fallback strategy for critical UI elements
  if (text.length < 50) { // Only try this for short strings like titles, categories, etc.
    const availableLanguages = Object.keys(translationCache);
    for (const lang of availableLanguages) {
      if (lang !== 'en' && lang !== language && translationCache[lang][text]) {
        // We found this text translated in another language, might be better than nothing
        console.log(`Using ${lang} translation for ${text} as fallback for ${language}`);
        return translationCache[lang][text];
      }
    }
  }
  
  // For now, return the original text if no translation is found in cache
  // The async version translateTextAsync will fetch from the API
  return text;
}

/**
 * Function to translate text asynchronously using a translation API
 */
export async function translateTextAsync(text: string, targetLanguage: string): Promise<string> {
  // Return original text for English or if text is empty
  if (targetLanguage === 'en' || !text) {
    return text;
  }
  
  // Check cache first
  if (translationCache[targetLanguage]?.[text]) {
    return translationCache[targetLanguage][text];
  }
  
  // We'll use Google Translate API as it has better support for Indian languages
  // First, we'll try the alternative API that has better support for Indian languages
  try {
    // For certain languages that have issues with LibreTranslate, let's try a different approach
    // This will help with Gujarati, Telugu, Malayalam, Kannada, Odia, etc.
    if (['gu', 'te', 'ml', 'kn', 'or', 'as', 'kok', 'ks', 'sd', 'mni', 'brx'].includes(targetLanguage)) {
      // We'll use a more reliable API for these languages
      const API_URL = 'https://libretranslate.de/translate';
      
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          q: text,
          source: 'en',
          target: targetLanguage,
          format: 'text',
          api_key: ''  // Free API tier
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.translatedText) {
          // Store result in cache
          if (!translationCache[targetLanguage]) {
            translationCache[targetLanguage] = {};
          }
          translationCache[targetLanguage][text] = data.translatedText;
          return data.translatedText;
        }
      }
      
      // If that fails, we'll fall through to the original API
      console.log(`Alternative API failed for ${targetLanguage}, trying original API...`);
    }
    
    // Primary API - LibreTranslate
    const API_URL = 'https://translate.argosopentech.com/translate';
    
    // Check if this language is supported by the API
    const apiLanguageCode = languageCodeMap[targetLanguage];
    
    // Some languages might not be supported by the API
    if (!apiLanguageCode) {
      console.warn(`Language ${targetLanguage} not found in supported API languages, using fallback mechanism`);
      
      // Try to find a similar language that is supported
      // For example, for Odia (or) we might use Hindi (hi)
      const fallbackMap: Record<string, string> = {
        'or': 'hi',  // Odia -> Hindi
        'kok': 'mr', // Konkani -> Marathi
        'as': 'bn',  // Assamese -> Bengali
        'brx': 'hi', // Bodo -> Hindi
        'ks': 'hi',  // Kashmiri -> Hindi
        'sd': 'hi',  // Sindhi -> Hindi
        'mni': 'hi'  // Manipuri -> Hindi
      };
      
      const fallbackLanguage = fallbackMap[targetLanguage];
      if (fallbackLanguage) {
        console.log(`Using ${fallbackLanguage} as fallback translation for ${targetLanguage}`);
        // Recursive call with fallback language
        const fallbackResult = await translateTextAsync(text, fallbackLanguage);
        
        // Store in original language cache too
        if (!translationCache[targetLanguage]) {
          translationCache[targetLanguage] = {};
        }
        translationCache[targetLanguage][text] = fallbackResult;
        return fallbackResult;
      }
      
      return text; // If no fallback, return original
    }
    
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: apiLanguageCode,
        format: 'text'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Translation API error');
    }
    
    const data = await response.json();
    const translatedText = data.translatedText;
    
    // Store the result in cache for future use
    if (!translationCache[targetLanguage]) {
      translationCache[targetLanguage] = {};
    }
    translationCache[targetLanguage][text] = translatedText;
    
    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    
    // Try more aggressive fallback mechanisms
    // See if we have this text in any other Indian language, as cross-language similarities might help
    const indianLanguages = ['hi', 'bn', 'ta', 'te', 'ml', 'kn', 'gu', 'pa', 'mr', 'or'];
    for (const lang of indianLanguages) {
      if (lang !== targetLanguage && translationCache[lang]?.[text]) {
        console.log(`Using ${lang} translation as fallback for ${targetLanguage}`);
        // Store in cache for next time
        if (!translationCache[targetLanguage]) {
          translationCache[targetLanguage] = {};
        }
        translationCache[targetLanguage][text] = translationCache[lang][text];
        return translationCache[lang][text];
      }
    }
    
    // If API call fails and no cache found, return the original text
    return text;
  }
}

/**
 * React hook for translating content
 * Caches translations for better performance
 */
export function useTranslation() {
  const { toast } = useToast();
  const [hasShownError, setHasShownError] = useState<boolean>(false);
  
  useEffect(() => {
    // Reset error flag when component remounts
    return () => setHasShownError(false);
  }, []);
  
  const translate = async (text: string | null | undefined, language: string): Promise<string> => {
    if (!text) return '';
    
    try {
      return await translateTextAsync(text, language);
    } catch (error) {
      // Only show toast once per session to avoid spamming user
      if (!hasShownError) {
        toast({
          title: "Translation Service Notice",
          description: "Using cached translations. Some content may appear in English.",
          variant: "default",
          duration: 5000
        });
        setHasShownError(true);
      }
      
      // Log the error but don't disrupt user experience
      console.error('Translation error:', error);
      
      // Return original text when translation fails
      return text || '';
    }
  };
  
  // Add helper to pre-warm the cache with bulk translations
  const preloadTranslations = async (texts: string[], language: string): Promise<void> => {
    if (language === 'en') return;
    
    // Filter only texts that aren't in the cache already
    const textsToTranslate = texts.filter(text => 
      text && text.length > 0 && !translationCache[language]?.[text]
    );
    
    if (textsToTranslate.length === 0) return;
    
    // Translate in small batches to avoid API limitations
    // This is done silently in the background
    const batchSize = 5;
    for (let i = 0; i < textsToTranslate.length; i += batchSize) {
      const batch = textsToTranslate.slice(i, i + batchSize);
      await Promise.all(batch.map(text => translateTextAsync(text, language).catch(err => {
        console.error('Batch translation error:', err);
        return text;
      })));
      
      // Small delay between batches to be nice to the API
      if (i + batchSize < textsToTranslate.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  };
  
  return { 
    translate,
    preloadTranslations
  };
}