# Proje Dokümantasyon Denetimi

_Started 2026-06-13 20:23 UTC_

---

## User

projenin dökümanınıa göre eksik ne kaldı

## Assistant

_[tool: list_files]_

Projeyi inceleyeyim — önce dosyalara ve dokümana bakayım.

_[tool: read_file]_

_[tool: read_file]_

Dokümanı (readme.md ve SKILL.md) okuyayım, sonra mevcut bileşenlerle karşılaştırayım.

_[tool: list_files]_

_[tool: list_files]_

_[tool: list_files]_

_[tool: list_files]_

Mevcut bileşenleri ve varlıkları dokümandaki INDEX ile karşılaştırayım.

_[tool: check_design_system]_

_[tool: grep]_

_[tool: grep]_

İki net boşluk görünüyor ama doğrulayayım — `IconButton` ve `assets/logo.html` dokümanda geçiyor. Compiler'ın ne gördüğünü ve `IconButton` referanslarını kontrol edeyim.

Dokümanı (readme.md INDEX + gövde) projedeki gerçek dosyalarla karşılaştırdım. Üç tutarsızlık var — yani dokümana göre **eksik veya hatalı** olanlar:

## Eksikler

**1. `IconButton` bileşeni — eksik**
INDEX tablosu `components/core/` altında onu listeliyor:
> <cite index="77-0">Button, IconButton, Badge, Input, Switch, Checkbox, Avatar, Skeleton, Logo, Icon</cite>

Ama `components/core/` içinde `IconButton.jsx / .d.ts / .prompt.md` **yok**. Derleyici de onu görmüyor (mevcut core bileşenleri: Avatar, Badge, Button, Checkbox, Icon, Input, Logo, Skeleton, Switch). Diğer tüm `surfaces/` ve `storage/` bileşenleri ise tam.

**2. `assets/logo.html` reçetesi — eksik**
Logo bölümü buna açıkça atıf yapıyor:
> <cite index="67-0">the brand mark is a lettermark tile... See `assets/logo.html` recipe + the Logo component</cite>

`assets/` klasöründe sadece `fonts/`, `icons/`, `thumbs/`, `favicon.ico` var — `logo.html` **yok**.

## Doküman hatası (mevcut ama yanlış yazılmış)

**3. Namespace uyumsuzluğu**
README iki yerde `const { Button } = window.ZenStorage` ve `window.ZenStorage.Icon` diyor. Ancak gerçek derlenen namespace **`window.ZenStorageDesignSystem_33e1f8`**. README'yi takip eden tüketici kod bu yüzden çalışmaz.

---

İsterseniz şunları yapabilirim:
- **`IconButton`** bileşenini (mevcut `Button`/`Icon` deseniyle, `.jsx` + `.d.ts` + `.prompt.md` + dsCard) oluşturayım,
- **`assets/logo.html`** reçete sayfasını ekleyeyim,
- README'deki **namespace referanslarını** gerçek değerle düzelteyim (ya da gerçek ismi gizlemek için README'yi nötr bir ifadeyle güncelleyeyim).

Hangilerini halledeyim?

