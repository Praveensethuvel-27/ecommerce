import { createContext, useContext, useState } from 'react';

const LanguageContext = createContext(null);

const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.shop': 'Shop',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.faq': 'FAQ',
    
    // Common
    'common.shopNow': 'Shop Now',
    'common.viewAll': 'View All Products',
    'common.addToCart': 'Add to Cart',
    'common.sale': 'Sale',
    'common.backToShop': 'Back to Shop',
    'common.productNotFound': 'Product not found.',
    'common.allProducts': 'All Products',
    'common.noProductsFound': 'No products found.',
    'common.home': 'Home',
    'common.shop': 'Shop',
    'common.login': 'Login',
    'common.logout': 'Logout',
    'common.myAccount': 'My Account',
    'common.orders': 'Orders',
    'common.admin': 'Admin',
    
    // Home Page
    'home.hero.title': 'Traditional Tamil Organic Wellness',
    'home.hero.subtitle': 'Handcrafted with love, passed down through generations.',
    'home.hero.description': 'Pure, natural, and authentic',
    'home.featuredProducts': 'Featured Products',
    'home.shopByCategory': 'Shop by Category',
    'home.healthBenefits': 'Health Benefits',
    'home.testimonials': 'What Our Customers Say',
    'home.freeShipping': 'Free Shipping on Orders Above Rs. 999',
    'home.trust.organic': '100% Organic',
    'home.trust.traditional': 'Traditional Recipes',
    'home.trust.natural': 'Natural Ingredients',
    
    // Health Benefits
    'home.benefit.skincare.title': 'Natural Skincare',
    'home.benefit.skincare.desc': 'Traditional powders and maavus for radiant skin',
    'home.benefit.weight.title': 'Weight Management',
    'home.benefit.weight.desc': 'Special blends to support your wellness journey',
    'home.benefit.recipes.title': 'Traditional Recipes',
    'home.benefit.recipes.desc': 'Authentic Tamil preparations passed down generations',
    
    // Product Page
    'product.organic': '100% Organic',
    'product.traditional': 'Traditional',
    'product.ingredients': 'Ingredients',
    'product.healthBenefits': 'Health Benefits',
    'product.usageInstructions': 'Usage Instructions',
    'product.relatedProducts': 'Related Products',
    'product.organicCertified': 'Organic Certified',
    'product.naturalIngredients': 'Natural Ingredients',
    'product.benefit.description': 'Traditional Tamil organic benefits.',
    
    // Health Benefits - Common
    'benefit.naturalSkinNourishment': 'Natural skin nourishment',
    'benefit.removesDeadSkin': 'Removes dead skin cells',
    'benefit.promotesGlowingSkin': 'Promotes glowing skin',
    'benefit.traditionalCooling': 'Traditional cooling effect',
    'benefit.reducesInflammation': 'Reduces inflammation',
    'benefit.brightensSkin': 'Brightens skin',
    'benefit.fightsAcne': 'Fights acne',
    'benefit.naturalAntiseptic': 'Natural antiseptic',
    'benefit.easyDigestion': 'Easy digestion',
    'benefit.richInProtein': 'Rich in protein',
    'benefit.lowGlycemicIndex': 'Low glycemic index',
    'benefit.coolingForBody': 'Cooling for body',
    'benefit.highProtein': 'High protein',
    'benefit.fiberRich': 'Fiber-rich',
    'benefit.supportsWeightManagement': 'Supports weight management',
    'benefit.nutrientDense': 'Nutrient-dense',
    'benefit.highIronContent': 'High iron content',
    'benefit.diabetesFriendly': 'Diabetes-friendly',
    'benefit.glutenFree': 'Gluten-free',
    'benefit.energyBooster': 'Energy booster',
    'benefit.highAntioxidants': 'High antioxidants',
    'benefit.supportsDigestion': 'Supports digestion',
    'benefit.energyBoost': 'Energy boost',
    'benefit.supportsMetabolism': 'Supports metabolism',
    'benefit.keepsFullLonger': 'Keeps you full longer',
    'benefit.energyDense': 'Energy dense',
    'benefit.postPartumNourishment': 'Post-partum nourishment',
    'benefit.boneHealth': 'Bone health',
    'benefit.addsFlavorWithoutOil': 'Adds flavor without oil',
    'benefit.proteinBoost': 'Protein boost',
    'benefit.digestiveAid': 'Digestive aid',
    'benefit.traditionalTaste': 'Traditional taste',
    'benefit.metabolismBoost': 'Metabolism boost',
    'benefit.vitaminC': 'Vitamin C',
    'benefit.addsFlavor': 'Adds flavor',
    'benefit.naturalPreservative': 'Natural preservative',
    
    // Product Names
    'product.nalanguMaavu': 'Nalangu Maavu',
    'product.kasturiManjal': 'Kasturi Manjal',
    'product.payathamMaavu': 'Payatham Maavu',
    'product.kadalaiMaavu': 'Kadalai Maavu',
    'product.kambuMaavu': 'Kambu Maavu',
    'product.karuppuKavuniKanji': 'Karuppu Kavuni Kanji Mix',
    'product.weightLossMix': 'Weight Loss Mix',
    'product.karuppuUlunduKali': 'Karuppu Ulundu Kali Mix',
    'product.idliPodi': 'Idli Podi',
    'product.milagaiThool': 'Milagai Thool',
    'product.greenGramFlour': 'Green Gram Flour',
    
    // Categories
    'category.maavus': 'Maavus',
    'category.kanjiKali': 'Kanji/Kali Mixes',
    'category.podiThool': 'Podi/Thool',
    'category.specialBlends': 'Special Blends',
    
    // Filter Sidebar
    'filter.filtersAndSort': 'Filters & Sort',
    'filter.category': 'Category',
    'filter.allCategories': 'All Categories',
    'filter.sortBy': 'Sort by',
    'filter.sort.popularity': 'Popularity',
    'filter.sort.priceLow': 'Price: Low to High',
    'filter.sort.priceHigh': 'Price: High to Low',
    'filter.sort.newest': 'Newest',
    'filter.priceRange': 'Price Range',
    'filter.min': 'Min',
    'filter.max': 'Max',
  },
  ta: {
    // Navigation
    'nav.home': 'முகப்பு',
    'nav.shop': 'கடை',
    'nav.about': 'எங்களை பற்றி',
    'nav.contact': 'தொடர்பு',
    'nav.faq': 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
    
    // Common
    'common.shopNow': 'இப்போது வாங்க',
    'common.viewAll': 'அனைத்து பொருட்களையும் பார்க்க',
    'common.addToCart': 'கார்ட்டில் சேர்',
    'common.sale': 'விற்பனை',
    'common.backToShop': 'கடைக்கு திரும்ப',
    'common.productNotFound': 'பொருள் கிடைக்கவில்லை.',
    'common.allProducts': 'அனைத்து பொருட்கள்',
    'common.noProductsFound': 'பொருட்கள் எதுவும் கிடைக்கவில்லை.',
    'common.home': 'முகப்பு',
    'common.shop': 'கடை',
    'common.login': 'உள்நுழை',
    'common.logout': 'வெளியேற',
    'common.myAccount': 'என் கணக்கு',
    'common.orders': 'ஆர்டர்கள்',
    'common.admin': 'நிர்வாகம்',
    
    // Home Page
    'home.hero.title': 'பாரம்பரிய தமிழ் கரிம ஆரோக்கியம்',
    'home.hero.subtitle': 'அன்புடன் செய்யப்பட்டது, தலைமுறைகளாக கடத்தப்பட்டது.',
    'home.hero.description': 'தூய்மையான, இயற்கையான மற்றும் உண்மையான',
    'home.featuredProducts': 'முக்கிய பொருட்கள்',
    'home.shopByCategory': 'வகையின்படி கடை',
    'home.healthBenefits': 'ஆரோக்கிய நன்மைகள்',
    'home.testimonials': 'எங்கள் வாடிக்கையாளர்கள் என்ன சொல்கிறார்கள்',
    'home.freeShipping': 'ரூ. 999 க்கு மேல் ஆர்டர்களுக்கு இலவச ஷிப்பிங்',
    'home.trust.organic': '100% கரிம',
    'home.trust.traditional': 'பாரம்பரிய செய்முறைகள்',
    'home.trust.natural': 'இயற்கை பொருட்கள்',
    
    // Health Benefits
    'home.benefit.skincare.title': 'இயற்கை தோல் பராமரிப்பு',
    'home.benefit.skincare.desc': 'பிரகாசமான தோலுக்கான பாரம்பரிய தூள் மற்றும் மாவுகள்',
    'home.benefit.weight.title': 'எடை மேலாண்மை',
    'home.benefit.weight.desc': 'உங்கள் ஆரோக்கிய பயணத்தை ஆதரிக்க சிறப்பு கலவைகள்',
    'home.benefit.recipes.title': 'பாரம்பரிய செய்முறைகள்',
    'home.benefit.recipes.desc': 'தலைமுறைகளாக கடத்தப்பட்ட உண்மையான தமிழ் தயாரிப்புகள்',
    
    // Product Page
    'product.organic': '100% கரிம',
    'product.traditional': 'பாரம்பரிய',
    'product.ingredients': 'பொருட்கள்',
    'product.healthBenefits': 'ஆரோக்கிய நன்மைகள்',
    'product.usageInstructions': 'பயன்பாட்டு வழிமுறைகள்',
    'product.relatedProducts': 'தொடர்புடைய பொருட்கள்',
    'product.organicCertified': 'கரிம சான்றளிக்கப்பட்டது',
    'product.naturalIngredients': 'இயற்கை பொருட்கள்',
    'product.benefit.description': 'பாரம்பரிய தமிழ் கரிம நன்மைகள்.',
    
    // Health Benefits - Common (Tamil)
    'benefit.naturalSkinNourishment': 'இயற்கை தோல் ஊட்டம்',
    'benefit.removesDeadSkin': 'இறந்த தோல் செல்களை நீக்குகிறது',
    'benefit.promotesGlowingSkin': 'பிரகாசமான தோலை ஊக்குவிக்கிறது',
    'benefit.traditionalCooling': 'பாரம்பரிய குளிர்ச்சி விளைவு',
    'benefit.reducesInflammation': 'வீக்கத்தை குறைக்கிறது',
    'benefit.brightensSkin': 'தோலை பிரகாசமாக்குகிறது',
    'benefit.fightsAcne': 'முகப்பரு எதிர்க்கிறது',
    'benefit.naturalAntiseptic': 'இயற்கை கிருமி நாசினி',
    'benefit.easyDigestion': 'எளிதான செரிமானம்',
    'benefit.richInProtein': 'புரதம் நிறைந்தது',
    'benefit.lowGlycemicIndex': 'குறைந்த கிளைசெமிக் குறியீடு',
    'benefit.coolingForBody': 'உடலுக்கு குளிர்ச்சி',
    'benefit.highProtein': 'அதிக புரதம்',
    'benefit.fiberRich': 'நார்ச்சத்து நிறைந்தது',
    'benefit.supportsWeightManagement': 'எடை மேலாண்மையை ஆதரிக்கிறது',
    'benefit.nutrientDense': 'ஊட்டச்சத்து நிறைந்தது',
    'benefit.highIronContent': 'அதிக இரும்பு உள்ளடக்கம்',
    'benefit.diabetesFriendly': 'நீரிழிவு நட்பு',
    'benefit.glutenFree': 'குளுட்டன் இல்லாதது',
    'benefit.energyBooster': 'ஆற்றல் அதிகரிப்பு',
    'benefit.highAntioxidants': 'அதிக ஆன்டிஆக்ஸிடன்ட்கள்',
    'benefit.supportsDigestion': 'செரிமானத்தை ஆதரிக்கிறது',
    'benefit.energyBoost': 'ஆற்றல் அதிகரிப்பு',
    'benefit.supportsMetabolism': 'வளர்சிதை மாற்றத்தை ஆதரிக்கிறது',
    'benefit.keepsFullLonger': 'நீண்ட நேரம் நிறைவாக வைக்கிறது',
    'benefit.energyDense': 'ஆற்றல் நிறைந்தது',
    'benefit.postPartumNourishment': 'பிரசவத்திற்குப் பின் ஊட்டம்',
    'benefit.boneHealth': 'எலும்பு ஆரோக்கியம்',
    'benefit.addsFlavorWithoutOil': 'எண்ணெய் இல்லாமல் சுவையை சேர்க்கிறது',
    'benefit.proteinBoost': 'புரத அதிகரிப்பு',
    'benefit.digestiveAid': 'செரிமான உதவி',
    'benefit.traditionalTaste': 'பாரம்பரிய சுவை',
    'benefit.metabolismBoost': 'வளர்சிதை மாற்ற அதிகரிப்பு',
    'benefit.vitaminC': 'வைட்டமின் சி',
    'benefit.addsFlavor': 'சுவையை சேர்க்கிறது',
    'benefit.naturalPreservative': 'இயற்கை பாதுகாப்பு',
    
    // Product Names
    'product.nalanguMaavu': 'நலங்கு மாவு',
    'product.kasturiManjal': 'கஸ்தூரி மஞ்சள்',
    'product.payathamMaavu': 'பயத்தம் மாவு',
    'product.kadalaiMaavu': 'கடலை மாவு',
    'product.kambuMaavu': 'கம்பு மாவு',
    'product.karuppuKavuniKanji': 'கரப்பு கவுனி கஞ்சி கலவை',
    'product.weightLossMix': 'எடை குறைப்பு கலவை',
    'product.karuppuUlunduKali': 'கரப்பு உளுந்து கலி கலவை',
    'product.idliPodi': 'இட்லி பொடி',
    'product.milagaiThool': 'மிளகாய் தூள்',
    'product.greenGramFlour': 'பயற்றம் மாவு',
    
    // Categories
    'category.maavus': 'மாவுகள்',
    'category.kanjiKali': 'கஞ்சி/கலி கலவைகள்',
    'category.podiThool': 'பொடி/தூள்',
    'category.specialBlends': 'சிறப்பு கலவைகள்',
    
    // Filter Sidebar
    'filter.filtersAndSort': 'வடிகட்டிகள் மற்றும் வரிசைப்படுத்து',
    'filter.category': 'வகை',
    'filter.allCategories': 'அனைத்து வகைகள்',
    'filter.sortBy': 'வரிசைப்படுத்து',
    'filter.sort.popularity': 'பிரபலம்',
    'filter.sort.priceLow': 'விலை: குறைந்தது முதல் அதிகம்',
    'filter.sort.priceHigh': 'விலை: அதிகம் முதல் குறைந்தது',
    'filter.sort.newest': 'புதியது',
    'filter.priceRange': 'விலை வரம்பு',
    'filter.min': 'குறைந்தது',
    'filter.max': 'அதிகம்',
  },
};

function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('grandmascare_language');
    return saved || 'en';
  });

  const handleSetLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('grandmascare_language', lang);
  };

  const t = (key) => {
    const langTable = translations[language] || translations.en;
    return langTable[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage: handleSetLanguage, 
      t
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export { LanguageProvider, useLanguage };

