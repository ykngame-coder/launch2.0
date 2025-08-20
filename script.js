const API_URL = "https://script.google.com/macros/s/AKfycby7TxWIWyxmnPbHsk990p90OKZ6szCMekdYofQ445sQWGZQDRuCqJJVqOjMLXtew99h/exec"; // Remplace par l'URL de ton Google Apps Script

// Fonction pour changer d'onglet
function openTab(tabName){
  document.querySelectorAll('.tabcontent').forEach(div => div.style.display='none'); // cache tout
  document.getElementById(tabName).style.display = 'block'; // affiche l'onglet choisi
}

// Charger toutes les transactions depuis Google Sheet
async function loadTransactions() {
  try {
    const response = await fetch(API_URL);
    const transactions = await response.json();

    const list = document.getElementById("transactions-list");
    list.innerHTML = "";
    let soldeTotal = 0;
    const categoriesData = {};

    transactions.forEach(t => {
      const li = document.createElement("li");

      const dateFr = new Date(t.date).toLocaleDateString("fr-FR"); // format français
       const montant = parseFloat(t.montant) || 0; // convertir en nombre
      const montantStyle = montant >= 0 ? "positive" : "negative"; // couleur selon dépense/revenu
      soldeTotal += montant;

      // Comptabilisation par catégorie
      if(!categoriesData[t.categorie]) categoriesData[t.categorie] = 0;
      categoriesData[t.categorie] += montant;

      // Affiche les informations
      li.innerHTML = `
        ${dateFr} - 
        <span class="${montantStyle}">${montant.toFixed(2)}€</span> - 
        ${t.categorie} - 
        ${t.description} - 
        ${t.compte} - 
       ${(t.etiquettes && t.etiquettes.length) ? t.etiquettes.join(", ") : ""}
      `;
      list.appendChild(li);
    });

    document.getElementById("solde").textContent = soldeTotal.toFixed(2); // affiche le solde total

    // 🔹 Graphe catégories
    const ctxCat = document.getElementById('categorieChart').getContext('2d');
    new Chart(ctxCat, {
      type: 'bar',
      data: {
        labels: Object.keys(categoriesData),
        datasets: [{
          label: 'Montant par catégorie (€)',
          data: Object.values(categoriesData),
          backgroundColor: 'rgba(0, 102, 204, 0.6)'
        }]
      }
    });

    // 🔹 Graphe solde cumulatif
    const dates = transactions.map(t => new Date(t.date).toLocaleDateString("fr-FR"));
    let cumul = 0;
    const soldeData = transactions.map(t => {
      cumul += parseFloat(t.montant) || 0; // ⚡ simplifié
      return cumul;
    });

    const ctxSolde = document.getElementById('soldeChart').getContext('2d');
    new Chart(ctxSolde, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Évolution du solde (€)',
          data: soldeData,
          borderColor: 'rgba(0, 204, 102, 1)',
          backgroundColor: 'rgba(0, 204, 102, 0.2)',
          fill: true,
          tension: 0.2
        }]
      }
    });

  } catch (err) {
    console.error("Erreur chargement transactions :", err);
  }
}

// Soumission formulaire : ajouter une transaction
document.getElementById("transaction-form").addEventListener("submit", async e => {
  e.preventDefault();
  const formData = Object.fromEntries(new FormData(e.target).entries());

  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    e.target.reset(); // vide le formulaire
    loadTransactions(); // recharge les transactions et graphes
  } catch(err) {
    console.error("Erreur ajout transaction :", err);
  }
});

// Charger au début
loadTransactions();
