# Site dash.

Projet fait en JavaScript / HTML / CSS autour de l'artiste dash.  
L'idee etait de faire un petit site complet avec plusieurs pages, pas juste une page vitrine. Il y a une page d'accueil, une page pour les sons, une page events et une boutique merch avec un panier.

## Ce qu'il y a dans le site

- `index.html` : page d'accueil avec l'ambiance visuelle du site et les sons SoundCloud.
- `tracks.html` : page avec les covers des morceaux, un carrousel controlable et un lecteur SoundCloud.
- `events.html` : dates de concerts / evenements, avec des boutons pour ajouter dans un calendrier.
- `merch.html` : boutique merch avec choix de tailles, quantites et panier.
- `style.css` : tout le style du site.
- `server.js` : petit serveur Node pour lancer le projet et recuperer les donnees.

## Le JavaScript utilise

J'ai surtout travaille le JS sur ces fichiers :

- `js/navigation.js` : menu mobile, ouverture/fermeture du menu et gestion du header.
- `js/soundcloud-live.js` : recuperation des sons, affichage des covers, carrousel, clic sur les pochettes, navigation avec les fleches du clavier et swipe sur mobile.
- `js/events-calendar.js` : creation des liens Google Calendar, Outlook, Yahoo et fichier `.ics`.
- `js/merch-cart.js` : panier de la boutique, ajout au panier, changement des quantites, suppression d'un article et calcul du total.
- `scripts/soundcloud-scraper.js` : script pour recuperer les infos SoundCloud et les sauvegarder en local.

Le but etait d'utiliser du JS pour des vrais interactions : clics, evenements clavier, manipulation du DOM, tableaux d'objets, localStorage / donnees locales, et generation de liens dynamiques.

## Fonctionnalites

- menu responsive pour telephone ;
- fond video commun au site ;
- affichage des derniers sons SoundCloud ;
- carrousel de covers sans defilement automatique ;
- controle des tracks avec les fleches de l'interface et les fleches du clavier ;
- swipe tactile seulement sur telephone ;
- ajout d'un evenement dans plusieurs apps de calendrier ;
- panier merch cote front avec total, livraison et quantites.

## Lancer le projet

Il faut avoir Node installe, puis lancer :

```bash
npm start
```

Le site est ensuite disponible ici :

```txt
http://localhost:3000
```

## Organisation

```txt
.
|-- index.html
|-- tracks.html
|-- events.html
|-- merch.html
|-- style.css
|-- server.js
|-- data/
|   `-- soundcloud_data.json
|-- images/
|   |-- favicon.jpg
|   `-- fond.png
|-- js/
|   |-- navigation.js
|   |-- soundcloud-live.js
|   |-- events-calendar.js
|   `-- merch-cart.js
`-- scripts/
    `-- soundcloud-scraper.js
```
