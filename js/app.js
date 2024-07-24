(function () {
  function init() {
      var router = new Router([
          new Route('home', true),
          new Route('leads'),
          new Route('opportunities'),
          new Route('reports')
      ]);
  }
  init();
}());


domo.get(`/domo/users/v1/?includeDetails=true&limit=200`).then(function (data) {
  data.forEach(ele => {
      if (ele.id == domo.env.userId) {
          const welcomeMessage = 'Welcome <b>' + ele.displayName + '</b>!';
          document.getElementById("welcomeText").innerHTML = welcomeMessage;
          console.log(ele.displayName)
      }
  })
})


const createTicket = document.getElementById('createTicket');
const ticketForm = document.getElementById('ticketForm');
const createTeam = document.getElementById('createTeam');
const createForm = document.getElementById('createForm');
const createTeamNameInput = document.getElementById('createTeamName');
const createPersonsSelect = document.getElementById('select-persons');
const manageTeam = document.getElementById('manageTeam');
const manageForm = document.getElementById('manageForm');
//const teamDisplay = document.getElementById('teamDisplay');
const saveTeamButton = document.getElementById('saveTeamButton');
// const manageTeamNameDisplay = document.getElementById('manageTeamNameDisplay');
// const manageMembersDisplay = document.getElementById('manageMembersDisplay');
const manageTicket = document.getElementById('manageTicket');
const manageTicketForm = document.getElementById('manageTicketForm');

function hideAllForms() {
ticketForm.style.display = 'none';
createForm.style.display = 'none';
manageForm.style.display = 'none';
manageTicketForm.style.display = 'none';
}

createTicket.addEventListener('click', function () {
  // ticketForm.classList.toggle('show');
  hideAllForms();
  ticketForm.style.display = 'block';

})


// let formVisible = false;
// createTicket.addEventListener('click', function () {
//     if (formVisible) {
//         ticketForm.style.display = "none";
//     } else {
//         ticketForm.style.display = "block";
//     }
//     formVisible = !formVisible;
// });

function submitForm(){
  const teamSelect = document.getElementById('teamSelect').value;
  const ticketName = document.getElementById('ticketName').value;
  const ticketDetails = document.getElementById('ticketDetails').value;

  console.log(teamSelect);
  console.log(ticketName);
  console.log(ticketDetails);

  document.getElementById('teamSelect').value = "";
  document.getElementById('ticketName').value = "";
  document.getElementById('ticketDetails').value = "";

  const storeData = {
      "content": {
        teams: {
          'team_name': `${teamSelect}`,
        },
        ticket_name:{
          'ticket_name':`${ticketName}`,
        },
        ticket_details:{
          'ticket_details':`${ticketDetails}`
        },
      }
    }
    console.log(storeData);
    domo.post(`/domo/datastores/v1/collections/ticket_tool/documents/`, storeData)
      .then((response) => {
        console.log("Payment Request Created:", response);
        alert("Data stored successfully");
  });
  
  // sending mail to the team members

  const bodyEl = document.createElement('div');
  bodyEl.innerHTML = `
    <h2>New Ticket</h2>
    <p>Ticket Name: ${ticketName}</p>
    <p>Ticket Details: ${ticketDetails}</p>
  `;
  const bodyHTML = bodyEl.innerHTML;

  const startWorkflow = (alias, body) => {
    domo.post(`/domo/workflow/v1/models/${alias}/start`, body)
  }
  startWorkflow("send_email", { to: teamSelect, sub: `Ticketing tool`, body: bodyHTML})
}

// Create team
createTeam.addEventListener('click', function () {
  // createForm.classList.toggle('show');
  hideAllForms();
  createForm.style.display = 'block';
})

// getting domo user id and name & append the list of options in select element
const personSelect = document.getElementById('select-persons');
domo.get(`/domo/users/v1?includeDetails=true&limit=200`).then(function (data) {
//console.log(data[0].id)

data.forEach(user => {
  const option = document.createElement('option');
  option.value = user.id;
  option.textContent = user.displayName;
  personSelect.appendChild(option);
});
})

// manageTeam.addEventListener('click', function(){
//   manageForm.classList.toggle('show');

//   // Transfer values from Create Team form to Manage Team form
//   manageTeamNameDisplay.textContent = createTeamNameInput.value;
//   manageMembersDisplay.innerHTML = "";

//   Array.from(createPersonsSelect.options).forEach(option => {
//       if (option.selected) {
//           const listItem = document.createElement('li');
//           listItem.textContent = option.textContent;
//           manageMembersDisplay.appendChild(listItem);
//       }
//   });
// });


// Function to display teams in Manage Team form
let teams = {};
saveTeamButton.addEventListener('click', function () {
const teamName = createTeamNameInput.value;
const selectedMembers = Array.from(createPersonsSelect.options)
    .filter(option => option.selected)
    .map(option => ({
      id: option.value,
      displayName: option.textContent
    }));

  if (teamName && selectedMembers.length > 0) {
    // Store team data
    // teams[teamName] = selectedMembers;
    if (!teams[teamName]) {
      teams[teamName] = [];
    }
    teams[teamName] = teams[teamName].concat(selectedMembers);

    createTeamNameInput.value = "";
    createPersonsSelect.value = "";
    alert('Team created successfully!');
} else {
    alert('Please provide a team name and select at least one member.');
}

// selected user name  and AppDB 
const teamMember = selectedMembers.map(member => member.displayName).join(',');
const createTeamData = {
  "content": {
    team_name: {
      'team_name': `${teamName}`,
    },
    team_member:{
      'team_member':`${teamMember}`,
    },
  }
}
console.log(createTeamData);
domo.post(`/domo/datastores/v1/collections/create_team_tt/documents/`, createTeamData)
  .then((response) => {
    console.log("Create team data:", response);
    alert("Data stored successfully");
});

});


// Manage team to display AppDB stored values

manageTeam.addEventListener('click', function () {
// manageForm.classList.toggle('show');
hideAllForms();
manageForm.style.display = 'block';
fetchTeamsData() 
});

// Fetch create team data from AppDB
function fetchTeamsData(){
domo.get(`/domo/datastores/v1/collections/create_team_tt/documents/`)
  .then((data)=>{
    console.log(data);
    displayTeamsData(data);
  })
}

function displayTeamsData(data){
const tableContainer = document.getElementById('teamDisplay');
tableContainer.innerHTML = '';

const table = document.createElement('table');
table.classList.add('teams-table');

const thead = document.createElement('thead');
const headerRow = document.createElement('tr');

const headers = ['Team Name', 'Team Members', 'Actions'];
headers.forEach(headerText => {
  const th = document.createElement('th');
  th.textContent = headerText;
  th.classList.add('table-head');
  headerRow.appendChild(th);
});

thead.appendChild(headerRow);
table.appendChild(thead);

const tbody = document.createElement('tbody');

data.forEach((team, index) => {
  const row = document.createElement('tr');

  const teamNameCell = document.createElement('td');
  teamNameCell.textContent = team.content.team_name.team_name;
  row.appendChild(teamNameCell);

  const teamMembersCell = document.createElement('td');
  teamMembersCell.textContent = team.content.team_member.team_member;
  row.appendChild(teamMembersCell);

  const actionsCell = document.createElement('td');
  const editButton = document.createElement('button');
  editButton.textContent = 'Edit';
  editButton.classList.add('edit-button');
  editButton.addEventListener('click', () => editTeam(index));

  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Delete';
  deleteButton.classList.add('delete-button');
  deleteButton.addEventListener('click', () => deleteTeam(index));

  actionsCell.appendChild(editButton);
  actionsCell.appendChild(deleteButton);
  row.appendChild(actionsCell);

  tbody.appendChild(row);
});

table.appendChild(tbody);
tableContainer.appendChild(table);
}

// edit functionality
function editTeam(index) {
const team = data[index];

hideAllForms(); 
createForm.style.display = 'block'; 

createTeamNameInput.value = team.content.team_name.team_name;

const selectedMembers = team.content.team_member.team_member.split(',');
Array.from(createPersonsSelect.options).forEach(option => {
  option.selected = selectedMembers.includes(option.textContent);
});

// Handle form submission
saveButton.onclick = () => {
  const updatedTeam = {
    content: {
      team_name: {
        team_name: createTeamNameInput.value
      },
      team_member: {
        team_member: Array.from(createPersonsSelect.selectedOptions).map(option => option.textContent).join(',')
      }
    }
  };

  updateTeam(index, updatedTeam);
  displayTeamsData(data);
};
}

function updateTeam(index, updatedTeam) {
data[index] = updatedTeam;
}
// delete functionality
function deleteTeam(team){
domo.delete(`/domo/datastores/v1/collections/create_team_tt/documents/${teamId}`)
.then(()=>{
  console.log("Team deleted successfully");
  alert("Team deleted successfully");
  fetchTeamsData();
})
.catch(()=>{
  console.log("Error deleting team");
  alert("Error deleting team");
})
}

//Manage Ticket Functionality
manageTicket.addEventListener('click', function(){
hideAllForms();
manageTicketForm.style.display = 'block';
fetchTicketData();
});

// Fetch create ticket data from AppDB
function fetchTicketData(){
domo.get(`/domo/datastores/v1/collections/ticket_tool/documents/`)
  .then((data)=>{
    console.log(data);
    displayTicketData(data);
  })
}

function displayTicketData(data){
const ticketTableContainer = document.getElementById('ticketDisplay');
ticketTableContainer.innerHTML = '';

const ticketTable = document.createElement('table');
ticketTable.classList.add('tickets-table');

const ticketThead = document.createElement('thead');
const ticketHeaderRow = document.createElement('tr');

const headers = ['Team', 'Ticket Name', 'Ticket Details', "Actions"];
headers.forEach(headerText => {
  const ticktTh = document.createElement('th');
  ticktTh.textContent = headerText;
  ticktTh.classList.add('table-head');
  ticketHeaderRow.appendChild(ticktTh);
});

ticketThead.appendChild(ticketHeaderRow);
ticketTable.appendChild(ticketThead);

const ticketbody = document.createElement('tbody');

data.forEach((ticket, index )=> {
  const eachRow = document.createElement('tr');

  const teamNameCell = document.createElement('td');
  teamNameCell.textContent = ticket.content.teams.team_name;
  eachRow.appendChild(teamNameCell);

  const ticketNameCell = document.createElement('td');
  ticketNameCell.textContent = ticket.content.ticket_name.ticket_name;
  eachRow.appendChild(ticketNameCell);

  const ticketDetailsCell = document.createElement('td');
  ticketDetailsCell.textContent = ticket.content.ticket_details.ticket_details;
  eachRow.appendChild(ticketDetailsCell);
  
  const actionsCell = document.createElement('td');
  const editButton = document.createElement('button');
  editButton.textContent = 'Edit';
  editButton.classList.add('edit-button');
  editButton.addEventListener('click', () => editTeam(index));

  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Delete';
  deleteButton.classList.add('delete-button');
  deleteButton.addEventListener('click', () => deleteTeam(index));

  actionsCell.appendChild(editButton);
  actionsCell.appendChild(deleteButton);
  eachRow.appendChild(actionsCell);

  ticketbody.appendChild(eachRow);
});

ticketTable.appendChild(ticketbody);
ticketTableContainer.appendChild(ticketTable);
}
