export type Phrase = {
  it: string;
  en: string;
  say: string;
};

export type PhraseGroup = {
  label: string;
  phrases: Phrase[];
};

export const phraseGroups: PhraseGroup[] = [
  {
    label: "Emergency",
    phrases: [
      { it: "Aiuto!", en: "Help!", say: "ah-YOO-toh" },
      { it: "È un'emergenza", en: "It's an emergency", say: "eh oon eh-mer-JEN-tsah" },
      { it: "Chiamate la polizia!", en: "Call the police!", say: "kyah-MAH-teh lah po-lee-TSEE-ah" },
      { it: "Chiamate un'ambulanza!", en: "Call an ambulance!", say: "kyah-MAH-teh oon am-boo-LAHN-tsah" },
      { it: "Al fuoco!", en: "Fire!", say: "ahl FWOH-koh" },
    ],
  },
  {
    label: "Medical",
    phrases: [
      { it: "Ho bisogno di un medico", en: "I need a doctor", say: "oh bee-ZOHN-yoh dee oon MEH-dee-koh" },
      { it: "Dov'è l'ospedale?", en: "Where is the hospital?", say: "doh-VEH loh-speh-DAH-leh" },
      { it: "Dov'è la farmacia?", en: "Where is the pharmacy?", say: "doh-VEH lah far-mah-CHEE-ah" },
      { it: "Sono allergico/a a…", en: "I am allergic to…", say: "SOH-noh al-LEHR-jee-koh/kah ah" },
      { it: "Mi fa male qui", en: "It hurts here", say: "mee fah MAH-leh kwee" },
      { it: "Prendo questa medicina", en: "I take this medicine", say: "PREN-doh KWEH-stah meh-dee-CHEE-nah" },
    ],
  },
  {
    label: "Police",
    phrases: [
      { it: "Mi hanno derubato/a", en: "I've been robbed", say: "mee AHN-noh deh-roo-BAH-toh/tah" },
      { it: "Al ladro!", en: "Stop, thief!", say: "ahl LAH-droh" },
      { it: "Ho perso il passaporto", en: "I lost my passport", say: "oh PEHR-soh eel pas-sah-POR-toh" },
      { it: "Vorrei fare una denuncia", en: "I'd like to file a police report", say: "vor-RAY FAH-reh OO-nah deh-NOON-chah" },
      { it: "Lasciami in pace", en: "Leave me alone", say: "LAH-shah-mee een PAH-cheh" },
    ],
  },
  {
    label: "Getting help",
    phrases: [
      { it: "Parla inglese?", en: "Do you speak English?", say: "PAR-lah een-GLEH-zeh" },
      { it: "Ho bisogno di aiuto", en: "I need help", say: "oh bee-ZOHN-yoh dee ah-YOO-toh" },
      { it: "Mi sono perso/a", en: "I'm lost", say: "mee SOH-noh PEHR-soh/sah" },
      { it: "Dove siamo?", en: "Where are we?", say: "DOH-veh see-AH-moh" },
      { it: "Può scriverlo?", en: "Can you write it down?", say: "pwoh SKREE-vehr-loh" },
      { it: "Dov'è la stazione?", en: "Where is the station?", say: "doh-VEH lah stah-TSYOH-neh" },
    ],
  },
];
