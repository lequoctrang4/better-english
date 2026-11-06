"""Sinh web/src/data/sets.json — thư viện bộ từ vựng có sẵn cho web."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------- Động vật: lấy từ data/vocab.json (tag animals) ----------
vocab = json.load(open(f"{ROOT}/data/vocab.json", encoding="utf-8"))
ANIMAL_GROUPS = [
    ("farm", "Trang trại", "🐐"),
    ("pets", "Thú cưng", "🐶"),
    ("wild", "Động vật hoang dã", "🦊"),
    ("birds", "Các loài chim", "🦉"),
    ("sea", "Dưới biển", "🐬"),
    ("insects", "Côn trùng & con vật nhỏ", "🐝"),
]


def from_vocab(it):
    note = it.get("note", "")
    if it.get("collocations"):
        note = "\n".join(x for x in [note, "Cụm hay dùng: " + "; ".join(it["collocations"])] if x)
    return {
        "text": it["text"], "pos": it.get("pos", ""), "ipa": it.get("ipa", ""), "meaning": it["meaning"],
        "example": it.get("example", ""), "exampleVi": it.get("example_vi", ""), "note": note,
    }


animals = {
    "id": "animals", "tag": "animals", "emoji": "🐾", "name": "Động vật", "en": "Animals",
    "desc": "Vật nuôi, thú hoang, chim, sinh vật biển và côn trùng — kèm vài thành ngữ hay gặp như night owl, busy as a bee.",
    "groups": [],
}
for key, name, emoji in ANIMAL_GROUPS:
    words = [from_vocab(i) for i in vocab if "animals" in i.get("tags", []) and key in i.get("tags", [])]
    if words:
        animals["groups"].append({"name": name, "emoji": emoji, "words": words})


def W(text, ipa, meaning, ex, exvi, note="", pos="noun"):
    return {"text": text, "pos": pos, "ipa": ipa, "meaning": meaning, "example": ex, "exampleVi": exvi, "note": note}


household = {
    "id": "household", "tag": "household", "emoji": "🏠", "name": "Đồ vật trong nhà", "en": "Household items",
    "desc": "Những thứ bạn chạm vào mỗi ngày: nhà bếp, phòng ngủ, phòng tắm, phòng khách và dụng cụ.",
    "groups": [
        {"name": "Nhà bếp", "emoji": "🍳", "words": [
            W("kettle", "/ˈketl/", "ấm đun nước", "Can you put the kettle on?", "Bạn đun giúp ấm nước được không?", "'put the kettle on' = bật ấm đun nước (thường để pha trà)."),
            W("frying pan", "/ˈfraɪɪŋ pæn/", "chảo rán", "Heat some oil in a frying pan.", "Làm nóng chút dầu trong chảo."),
            W("pot", "/pɑːt/", "cái nồi", "She cooked a big pot of soup.", "Cô ấy nấu một nồi canh lớn."),
            W("cutting board", "/ˈkʌtɪŋ bɔːrd/", "cái thớt", "Put the onions on the cutting board.", "Để hành lên thớt đi."),
            W("ladle", "/ˈleɪdl/", "cái muôi, cái vá", "Use the ladle to serve the soup.", "Dùng muôi để múc canh."),
            W("chopsticks", "/ˈtʃɑːpstɪks/", "đôi đũa", "Can you pass me a pair of chopsticks?", "Đưa giúp mình một đôi đũa nhé?", "Luôn dùng số nhiều; một đôi: a pair of chopsticks."),
            W("fridge", "/frɪdʒ/", "tủ lạnh", "There's some leftover pizza in the fridge.", "Còn ít pizza thừa trong tủ lạnh.", "Trang trọng: refrigerator. Ngăn đá: freezer."),
            W("microwave", "/ˈmaɪkrəweɪv/", "lò vi sóng", "Just heat it up in the microwave.", "Cứ hâm nóng nó trong lò vi sóng.", "Cụm hay dùng: heat something up in the microwave."),
            W("sink", "/sɪŋk/", "bồn rửa", "The sink is full of dirty dishes.", "Bồn rửa đầy bát đĩa bẩn."),
            W("cupboard", "/ˈkʌbərd/", "tủ bếp, tủ chén", "The cups are in the cupboard above the sink.", "Cốc ở trong tủ phía trên bồn rửa.", "Chữ 'p' câm: /ˈkʌbərd/."),
        ]},
        {"name": "Phòng ngủ", "emoji": "🛏️", "words": [
            W("pillow", "/ˈpɪloʊ/", "cái gối", "I can't sleep without my own pillow.", "Tôi không ngủ được nếu thiếu gối của mình."),
            W("blanket", "/ˈblæŋkɪt/", "cái chăn", "It's cold, grab another blanket.", "Lạnh đấy, lấy thêm cái chăn đi."),
            W("mattress", "/ˈmætrəs/", "cái nệm", "This mattress is too soft for me.", "Cái nệm này quá mềm với tôi."),
            W("wardrobe", "/ˈwɔːrdroʊb/", "tủ quần áo", "Hang your shirt in the wardrobe.", "Treo áo vào tủ quần áo đi.", "Người Mỹ hay nói closet /ˈklɑːzɪt/ (tủ âm tường)."),
            W("hanger", "/ˈhæŋər/", "móc treo quần áo", "We need more hangers for these jackets.", "Mình cần thêm móc để treo mấy cái áo khoác này."),
            W("drawer", "/drɔːr/", "ngăn kéo", "My passport is in the top drawer.", "Hộ chiếu của tôi ở ngăn kéo trên cùng.", "Tủ có nhiều ngăn kéo: chest of drawers."),
            W("alarm clock", "/əˈlɑːrm klɑːk/", "đồng hồ báo thức", "I didn't hear my alarm clock this morning.", "Sáng nay tôi không nghe thấy chuông báo thức.", "Cụm hay dùng: set the alarm (for 6 a.m.)."),
        ]},
        {"name": "Phòng tắm", "emoji": "🛁", "words": [
            W("towel", "/ˈtaʊəl/", "khăn tắm", "Don't leave your wet towel on the bed.", "Đừng để khăn ướt trên giường."),
            W("toothbrush", "/ˈtuːθbrʌʃ/", "bàn chải đánh răng", "I forgot to pack my toothbrush.", "Tôi quên mang bàn chải đánh răng.", "Kem đánh răng: toothpaste."),
            W("shampoo", "/ʃæmˈpuː/", "dầu gội", "We're out of shampoo.", "Nhà mình hết dầu gội rồi.", "Dầu xả: conditioner."),
            W("razor", "/ˈreɪzər/", "dao cạo", "He shaves with an electric razor.", "Anh ấy cạo râu bằng dao cạo điện."),
            W("mirror", "/ˈmɪrər/", "cái gương", "She checked her hair in the mirror.", "Cô ấy soi gương xem lại tóc."),
            W("faucet", "/ˈfɔːsɪt/", "vòi nước", "The bathroom faucet is leaking again.", "Vòi nước phòng tắm lại bị rỉ.", "Anh-Anh: tap. Cụm hay dùng: turn on / turn off the faucet."),
        ]},
        {"name": "Phòng khách & dọn dẹp", "emoji": "🛋️", "words": [
            W("couch", "/kaʊtʃ/", "ghế sofa", "I fell asleep on the couch watching TV.", "Tôi ngủ quên trên sofa lúc xem TV.", "Đồng nghĩa: sofa. 'couch potato' = người lười, suốt ngày nằm xem TV."),
            W("cushion", "/ˈkʊʃn/", "gối tựa, đệm ghế", "The keys fell between the cushions.", "Chùm chìa khóa rơi vào giữa mấy cái gối tựa."),
            W("remote control", "/rɪˈmoʊt kənˈtroʊl/", "điều khiển từ xa", "Have you seen the remote control?", "Có ai thấy cái điều khiển đâu không?", "Nói tự nhiên: the remote."),
            W("curtain", "/ˈkɜːrtn/", "rèm cửa", "Can you close the curtains? It's too bright.", "Bạn kéo rèm lại được không? Chói quá.", "Cụm hay dùng: open / close / draw the curtains."),
            W("rug", "/rʌɡ/", "tấm thảm (nhỏ)", "The dog is sleeping on the rug.", "Con chó đang ngủ trên tấm thảm.", "Thảm trải kín sàn: carpet."),
            W("shelf", "/ʃelf/", "cái kệ, giá", "Put the books back on the shelf.", "Để sách lại lên kệ.", "Số nhiều: shelves. 'off-the-shelf' = có sẵn, mua về dùng ngay (VD: off-the-shelf software)."),
            W("light bulb", "/ˈlaɪt bʌlb/", "bóng đèn", "The light bulb in the hallway burned out.", "Bóng đèn ngoài hành lang bị cháy rồi.", "Thay bóng đèn: change / replace a light bulb."),
            W("extension cord", "/ɪkˈstenʃn kɔːrd/", "ổ cắm kéo dài", "We need an extension cord for the laptop.", "Mình cần một ổ cắm kéo dài cho laptop.", "Anh-Anh: extension lead."),
            W("vacuum cleaner", "/ˈvækjuːm ˌkliːnər/", "máy hút bụi", "The vacuum cleaner is really loud.", "Cái máy hút bụi ồn quá.", "Động từ: vacuum the floor = hút bụi sàn."),
            W("broom", "/bruːm/", "cái chổi", "Grab the broom and sweep the kitchen.", "Lấy chổi quét bếp đi.", "Quét nhà: sweep the floor."),
            W("bucket", "/ˈbʌkɪt/", "cái xô", "Fill the bucket with warm water.", "Đổ đầy nước ấm vào xô.", "'bucket list' = danh sách việc muốn làm trước khi chết."),
        ]},
        {"name": "Dụng cụ & đồ mang theo", "emoji": "🔧", "words": [
            W("scissors", "/ˈsɪzərz/", "cái kéo", "Do you have a pair of scissors?", "Bạn có cái kéo nào không?", "Luôn số nhiều: these scissors are… ; một cái: a pair of scissors."),
            W("hammer", "/ˈhæmər/", "cái búa", "I need a hammer to hang this picture.", "Tôi cần cái búa để treo bức tranh này."),
            W("screwdriver", "/ˈskruːdraɪvər/", "tua vít", "Use a small screwdriver to open the case.", "Dùng tua vít nhỏ để mở vỏ máy."),
            W("tape", "/teɪp/", "băng dính", "Stick the cable to the desk with tape.", "Dán dây cáp vào bàn bằng băng dính.", "Băng keo bạc: duct tape; băng dính trong (Mỹ): Scotch tape."),
            W("flashlight", "/ˈflæʃlaɪt/", "đèn pin", "Use your phone's flashlight, it's dark in here.", "Bật đèn pin điện thoại lên, trong này tối quá.", "Anh-Anh: torch."),
            W("umbrella", "/ʌmˈbrelə/", "cái ô, cái dù", "Take an umbrella, it might rain later.", "Mang ô theo đi, lát nữa có thể mưa."),
            W("wallet", "/ˈwɑːlɪt/", "cái ví", "I left my wallet at home.", "Tôi để quên ví ở nhà.", "Ví nữ (cầm tay): purse."),
        ]},
    ],
}

office = {
    "id": "office", "tag": "office", "emoji": "💻", "name": "Văn phòng & đồ công nghệ", "en": "Office & tech gear",
    "desc": "Đồ trên bàn làm việc của dân dev: sạc, cáp, màn hình, giấy nhớ, bảng trắng…",
    "groups": [
        {"name": "Đồ công nghệ", "emoji": "🔌", "words": [
            W("charger", "/ˈtʃɑːrdʒər/", "bộ sạc", "Can I borrow your laptop charger?", "Cho mình mượn sạc laptop được không?"),
            W("cable", "/ˈkeɪbl/", "dây cáp", "This HDMI cable is too short.", "Dây HDMI này ngắn quá."),
            W("adapter", "/əˈdæptər/", "bộ chuyển đổi; đầu chuyển", "I need a USB-C to HDMI adapter.", "Tôi cần một đầu chuyển USB-C sang HDMI."),
            W("power bank", "/ˈpaʊər bæŋk/", "sạc dự phòng", "My phone is dying, do you have a power bank?", "Điện thoại mình sắp hết pin, bạn có sạc dự phòng không?", "'my phone is dying' = điện thoại sắp hết pin."),
            W("power outlet", "/ˈpaʊər ˈaʊtlet/", "ổ cắm điện", "Is there a power outlet near this desk?", "Gần bàn này có ổ cắm điện không?", "Anh-Anh: socket / plug socket."),
            W("headphones", "/ˈhedfoʊnz/", "tai nghe (chụp tai)", "I wear headphones to focus while coding.", "Tôi đeo tai nghe để tập trung khi code.", "Tai nghe nhét tai: earbuds."),
            W("monitor", "/ˈmɑːnɪtər/", "màn hình máy tính", "I work with two monitors.", "Tôi làm việc với hai màn hình.", "Cũng là động từ: theo dõi, giám sát (monitor the server)."),
            W("webcam", "/ˈwebkæm/", "webcam", "Sorry, my webcam isn't working today.", "Xin lỗi, hôm nay webcam của tôi bị hỏng."),
            W("laptop stand", "/ˈlæptɑːp stænd/", "giá đỡ laptop", "A laptop stand is good for your neck.", "Giá đỡ laptop tốt cho cổ của bạn."),
            W("flash drive", "/ˈflæʃ draɪv/", "ổ USB", "Copy the files to a flash drive.", "Chép file vào USB đi.", "Cũng gọi: USB stick, thumb drive."),
            W("router", "/ˈraʊtər/", "bộ phát wifi, router", "Try restarting the router.", "Thử khởi động lại router xem.", "Anh-Anh đọc /ˈruːtər/."),
            W("projector", "/prəˈdʒektər/", "máy chiếu", "The projector in the meeting room isn't working.", "Máy chiếu ở phòng họp không chạy."),
            W("printer", "/ˈprɪntər/", "máy in", "The printer is jammed again.", "Máy in lại bị kẹt giấy.", "Kẹt giấy: paper jam; hết mực: out of ink."),
        ]},
        {"name": "Văn phòng phẩm", "emoji": "📎", "words": [
            W("sticky note", "/ˈstɪki noʊt/", "giấy nhớ", "I wrote the password on a sticky note. Bad idea!", "Tôi ghi mật khẩu lên giấy nhớ. Ý tồi!", "Cũng gọi theo tên hãng: Post-it."),
            W("whiteboard", "/ˈwaɪtbɔːrd/", "bảng trắng", "Let me draw the architecture on the whiteboard.", "Để tôi vẽ kiến trúc hệ thống lên bảng trắng.", "Họp phác thảo ý tưởng: a whiteboard session."),
            W("marker", "/ˈmɑːrkər/", "bút dạ", "This marker has run out of ink.", "Cây bút dạ này hết mực rồi."),
            W("highlighter", "/ˈhaɪlaɪtər/", "bút dạ quang", "Use a highlighter to mark the key points.", "Dùng bút dạ quang đánh dấu ý chính."),
            W("stapler", "/ˈsteɪplər/", "cái dập ghim", "Can you staple these pages together?", "Bạn dập ghim mấy trang này lại được không?", "Động từ: staple; ghim: staples."),
            W("paper clip", "/ˈpeɪpər klɪp/", "kẹp giấy", "Hold the receipts together with a paper clip.", "Kẹp mấy tờ hóa đơn lại bằng kẹp giấy."),
            W("folder", "/ˈfoʊldər/", "bìa hồ sơ; thư mục", "Save it in the shared folder.", "Lưu nó vào thư mục dùng chung."),
            W("envelope", "/ˈenvəloʊp/", "phong bì", "Put the contract in an envelope.", "Cho bản hợp đồng vào phong bì."),
        ]},
        {"name": "Nội thất văn phòng", "emoji": "🪑", "words": [
            W("swivel chair", "/ˈswɪvl tʃer/", "ghế xoay", "My swivel chair squeaks every time I move.", "Ghế xoay của tôi kêu cót két mỗi lần tôi cử động."),
            W("desk lamp", "/desk læmp/", "đèn bàn", "Turn on the desk lamp, it's getting dark.", "Bật đèn bàn lên, trời tối dần rồi."),
            W("trash can", "/ˈtræʃ kæn/", "thùng rác", "Throw it in the trash can.", "Ném nó vào thùng rác.", "Anh-Anh: bin / rubbish bin."),
            W("badge", "/bædʒ/", "thẻ nhân viên", "Don't forget your badge, or you can't get in.", "Đừng quên thẻ nhân viên, không là không vào được.", "Cụm hay dùng: ID badge; dây đeo thẻ: lanyard /ˈlænjərd/."),
            W("filing cabinet", "/ˈfaɪlɪŋ ˌkæbɪnət/", "tủ đựng hồ sơ", "The old contracts are in the filing cabinet.", "Hợp đồng cũ để trong tủ hồ sơ."),
        ]},
    ],
}

sets = [animals, household, office]
seen = set()
for s in sets:
    for g in s["groups"]:
        for w in g["words"]:
            assert w["text"] not in seen, w["text"]
            seen.add(w["text"])
            assert len(w["example"].split()) <= 15, w["text"]
out = f"{ROOT}/web/src/data/sets.json"
import os
os.makedirs(os.path.dirname(out), exist_ok=True)
json.dump(sets, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for s in sets:
    print(s["id"], sum(len(g["words"]) for g in s["groups"]))

# Bản tóm tắt nhỏ (không kèm từ) cho các trang tải sẵn như Luyện tập
meta = [{k: s[k] for k in ("id", "tag", "emoji", "name", "en")} for s in sets]
json.dump(meta, open(f"{ROOT}/web/src/data/sets-meta.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
