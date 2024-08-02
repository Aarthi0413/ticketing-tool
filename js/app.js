// (function () {
//   function init() {
//       var router = new Router([
//           new Route('home', true),
//           new Route('leads'),
//           new Route('opportunities'),
//           new Route('reports')
//       ]);
//   }
//   init();
// }());

// getting current user details from domo
const currentUserNameId = domo.env.userId;
console.log(currentUserNameId);
let username;
domo
  .get(`/domo/users/v1/${currentUserNameId}?inculudeDetails=true`)
  .then(function (data) {
    username = data.displayName;
    console.log(username);
  });

domo.get(`/domo/users/v1/?includeDetails=true&limit=200`).then(function (data) {
  data.forEach((ele) => {
    if (ele.id == domo.env.userId) {
      const welcomeMessage = "Welcome <b>" + ele.displayName + "</b>!";
      document.getElementById("welcomeText").innerHTML = welcomeMessage;
      console.log(ele.displayName);
    }
  });
});

const createTicket = document.getElementById("createTicket");
const ticketForm = document.getElementById("ticketForm");
const createTeam = document.getElementById("createTeam");
const createForm = document.getElementById("createForm");
const createTeamNameInput = document.getElementById("createTeamName");
const createPersonsSelect = document.getElementById("select-persons");
const manageTeam = document.getElementById("manageTeam");
const manageForm = document.getElementById("manageForm");
const saveTeamButton = document.getElementById("saveTeamButton");
const manageTicket = document.getElementById("manageTicket");
const manageTicketForm = document.getElementById("manageTicketForm");
const errorMessage = document.getElementById("errorMessage");
const teamMessage = document.getElementById("teamMessage");
const manageTeamMessage = document.getElementById("manageTeamMessage");
const manageTicketMessage = document.getElementById("manageTicketMessage");

function hideAllForms() {
  ticketForm.style.display = "none";
  createForm.style.display = "none";
  manageForm.style.display = "none";
  manageTicketForm.style.display = "none";
}

createTicket.addEventListener("click", function () {
  // ticketForm.classList.toggle('show');
  hideAllForms();
  ticketForm.style.display = "block";
});

function submitForm() {
  const teamSelect = document.getElementById("teamSelect");
  const ticketName = document.getElementById("ticketName").value;
  const ticketDetails = document.getElementById("ticketDetails").value;
  errorMessage.textContent = "";
  const teamId = teamSelect.value;
  console.log(teamId);

  console.log(teamSelect);
  console.log(ticketName);
  console.log(ticketDetails);

  if (!teamSelect.value || !ticketName || !ticketDetails) {
    displayMessage("*Please fill out all fields");
    return;
  }

  const selectedTeamName = teamSelect.options[teamSelect.selectedIndex]
  const selectedName = selectedTeamName ? selectedTeamName.textContent : 'No option selected';
  console.log(selectedName);

  document.getElementById("teamSelect").value = "";
  document.getElementById("ticketName").value = "";
  document.getElementById("ticketDetails").value = "";

  displayMessage("Ticket created successfully");

  const storeData = {
    content: {
      teams: {
        team_name: `${selectedName}`,
      },
      ticket_name: {
        ticket_name: `${ticketName}`,
      },
      ticket_details: {
        ticket_details: `${ticketDetails}`,
      },
    },
  };
  console.log(storeData);
  domo.post(`/domo/datastores/v1/collections/ticket_tool/documents/`, storeData)
    .then((response) => {
      console.log("Create Ticket data:", response);
      //alert("Data stored successfully");
      displayMessage('Data stored successfully');

      const bodyEl = document.createElement('div');
      bodyEl.innerHTML = `
        <p>Requestor Name: ${username}</p>
        <p>Ticket Name: ${ticketName}</p>
        <p>Ticket Details: ${ticketDetails}</p>
        <button style="width:100px;background-color:#007FFF;color:white;padding: 8px;border:none;border-radius:5px;cursor: pointer;">View Ticket</button>
      `;
      const bodyHTML = bodyEl.innerHTML;

      const startWorkflow = (alias, body) => {
        domo.post(`/domo/workflow/v1/models/${alias}/start`, body);
      };

      const emailSubject = `New Ticket Created by: ${username}`;
      console.log(teamId, "This is email id");
      startWorkflow("send_email",{to:teamId,sub:emailSubject,body:bodyHTML});
  });
}


// Create team
createTeam.addEventListener("click", function () {
  // createForm.classList.toggle('show');
  hideAllForms();
  createForm.style.display = "block";
});

// getting domo user id and name & append the list of options in select element
const personSelect = document.getElementById("select-persons");
domo.get(`/domo/users/v1?includeDetails=true&limit=200`).then(function (data) {
  console.log(data);

  data.forEach((user) => {
    const option = document.createElement("option");
    option.value = user.id;
    option.textContent = user.displayName;
    personSelect.appendChild(option);
  });
});

let teams = {};
// Manage team to display AppDB stored values
saveTeamButton.addEventListener("click", function () {
  const teamName = createTeamNameInput.value;
  const selectedMembers = Array.from(createPersonsSelect.options)
    .filter((option) => option.selected)
    .map((option) => ({
      id: option.value,
      displayName: option.textContent,
    }));
  console.log(selectedMembers);

  // if(!teamName){
  //   teamMessage.textContent = "Please provide a team name.";
  //   teamMessage.style.color = "#f02c2c";
  //   return;
  // }

  if (!teamName || selectedMembers.length === 0) {
    teamDisplayMessage("Please provide a team name and select a team members");
    return;
  }

  // Check if team already exists
  domo.get("/domo/datastores/v1/collections/create_team_tt/documents/")
    .then((data) => {
      const teamExists = data.some(
        (team) => team.content.team_name.team_name === teamName
      );

      if (teamExists) {
        teamDisplayMessage("Team already exists.");
        return;
      }

      if (!teams[teamName]) {
        teams[teamName] = [];
      }
      teams[teamName] = teams[teamName].concat(selectedMembers);

      if (
        !Array.from(teamSelect.options).find(
          (option) => option.value === teamName
        )
      ) {
        const option = document.createElement("option");
        option.value = teamName;
        option.textContent = teamName;
        teamSelect.appendChild(option);
      }

      createTeamNameInput.value = "";
      createPersonsSelect.value = "";
      teamDisplayMessage("Team created successfully!");

      const teamMember = selectedMembers.map((member) => member.displayName).join(",");
      const teamMemberId = selectedMembers.map(member => member.id);

      // currentTeamMemberId = teamMemberId;
      
      const createTeamData = {
        content: {
          team_name: {
            team_name: teamName,
          },
          team_member: {
            team_member: teamMember,
          },
          team_member_id:{
            team_member_id: teamMemberId
          }
        },
      };
      console.log(createTeamData);
      return domo.post("/domo/datastores/v1/collections/create_team_tt/documents/",createTeamData);
    })
    .then((response) => {
      if (response) {
        console.log("Create team data:", response);
        teamDisplayMessage("Data stored successfully");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});

document.addEventListener("DOMContentLoaded", function () {
  populateTeamSelect();
});

// Create ticket select options
function populateTeamSelect() {
  domo
    .get("/domo/datastores/v1/collections/create_team_tt/documents/")
    .then((data) => {
      console.log("TEAM DATA",data);
      const teamSelect = document.getElementById("teamSelect");
      teamSelect.innerHTML =
        '<option value="" disabled selected>Select Team</option>';

      data.forEach((team) => {
        console.log("Team Selected", team);
        const op = document.createElement("option");
        op.value = team.content.team_member_id.team_member_id;
        //console.log("ID VALUE",op.value)
        op.text = team.content.team_name.team_name;
        //console.log("TEXT", op.text)
        teamSelect.appendChild(op);
      });
    })
    .catch((error) => {
      console.error("Error fetching teams:", error);
    });
}

//Manage team data
manageTeam.addEventListener("click", function () {
  hideAllForms();
  manageForm.style.display = "block";
  fetchTeamsData();
});

// Fetch create team data from AppDB
function fetchTeamsData() {
  domo
    .get(`/domo/datastores/v1/collections/create_team_tt/documents/`)
    .then((data) => {
      console.log(data);
      displayTeamsData(data);
    });
}

function displayTeamsData(data) {
  const tableContainer = document.getElementById("teamDisplay");
  tableContainer.innerHTML = "";

  const table = document.createElement("table");
  table.classList.add("teams-table");

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  const headers = ["Team Name", "Team Members", "Actions"];
  headers.forEach((headerText) => {
    const th = document.createElement("th");
    th.textContent = headerText;
    th.classList.add("table-head");
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  data.forEach((team, index) => {
    const row = document.createElement("tr");

    const teamNameCell = document.createElement("td");
    teamNameCell.textContent = team.content.team_name.team_name;
    row.appendChild(teamNameCell);

    const teamMembersCell = document.createElement("td");
    teamMembersCell.textContent = team.content.team_member.team_member;
    row.appendChild(teamMembersCell);

    const actionsCell = document.createElement("td");
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.classList.add("edit-button");
    editButton.addEventListener("click", () => editTeam(index, data));

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("delete-button");
    deleteButton.addEventListener("click", () => deleteTeam(team.id));

    actionsCell.appendChild(editButton);
    actionsCell.appendChild(deleteButton);
    row.appendChild(actionsCell);

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  tableContainer.appendChild(table);
}

// edit functionality
function editTeam(index, data) {
  const team = data[index];

  hideAllForms();
  createForm.style.display = "block";

  createTeamNameInput.value = team.content.team_name.team_name;

  const selectedMembers = team.content.team_member.team_member.split(",");
  Array.from(createPersonsSelect.options).forEach((option) => {
    option.selected = selectedMembers.includes(option.textContent);
  });

  // Handle form submission
  saveTeamButton.onclick = async () => {
    const updatedTeamName = createTeamNameInput.value;
    const existingTeamNames = await fetchExistingTeamNames();

    if (
      existingTeamNames.includes(updatedTeamName) &&
      updatedTeamName !== team.content.team_name.team_name
    ) {
      // manageTeamMessage.textContent = "Team name already exists.";
      // manageTeamMessage.style.color = "#f02c2c";
      teamDisplayMessage("Team name already exists");
      return;
    }

    const updatedTeamMembers = Array.from(createPersonsSelect.selectedOptions)
      .map((option) => option.textContent)
      .join(",");

    const updatedTeam = {
      content: {
        team_name: {
          team_name: updatedTeamName,
        },
        team_member: {
          team_member: updatedTeamMembers,
        },
      },
    };
    updateTeam(team.id, updatedTeam);
    fetchTeamsData();
  };
}
// fetch existing create team data
function fetchExistingTeamNames() {
  return domo
    .get("/domo/datastores/v1/collections/create_team_tt/documents/")
    .then((data) => {
      return data.map((team) => team.content.team_name.team_name);
    })
    .catch((error) => {
      console.error("Error fetching teams:", error);
      return [];
    });
}
// update team
function updateTeam(teamId, updatedTeam) {
  domo
    .put(
      `/domo/datastores/v1/collections/create_team_tt/documents/${teamId}`,
      updatedTeam
    )
    .then(() => {
      console.log("Team updated successfully");
      // teamMessage.textContent = "Team updated successfully";
      // teamMessage.style.color = "#bbac0e";
      teamDisplayMessage("Team updated successfully");
    })
    .catch((error) => {
      console.log("Error updating team", error);
      // alert("Error updating team");
    });
}

// delete functionality
function deleteTeam(teamId) {
  domo
    .delete(
      `/domo/datastores/v1/collections/create_team_tt/documents/${teamId}`
    )
    .then(() => {
      // manageTeamMessage.text = "Team deleted successfully";
      // manageTeamMessage.style.color = "#bbac0e";
      manageTeamDisplayMessage("Team deleted successfully");
      fetchTeamsData();
    });
}

//Manage Ticket Functionality
manageTicket.addEventListener("click", function () {
  hideAllForms();
  manageTicketForm.style.display = "block";
  fetchTicketData();
});

// Fetch create ticket data from AppDB
function fetchTicketData() {
  domo
    .get(`/domo/datastores/v1/collections/ticket_tool/documents/`)
    .then((data) => {
      console.log(data);
      displayTicketData(data);
    });
}

function displayTicketData(data) {
  const ticketTableContainer = document.getElementById("ticketDisplay");
  ticketTableContainer.innerHTML = "";

  const ticketTable = document.createElement("table");
  ticketTable.classList.add("tickets-table");

  const ticketThead = document.createElement("thead");
  const ticketHeaderRow = document.createElement("tr");

  const headers = ["Team", "Ticket Name", "Ticket Details", "Actions"];
  headers.forEach((headerText) => {
    const ticktTh = document.createElement("th");
    ticktTh.textContent = headerText;
    ticktTh.classList.add("table-head");
    ticketHeaderRow.appendChild(ticktTh);
  });

  ticketThead.appendChild(ticketHeaderRow);
  ticketTable.appendChild(ticketThead);

  const ticketbody = document.createElement("tbody");

  data.forEach((ticket, index) => {
    const eachRow = document.createElement("tr");

    const teamNameCell = document.createElement("td");
    teamNameCell.textContent = ticket.content.teams.team_name;
    eachRow.appendChild(teamNameCell);

    const ticketNameCell = document.createElement("td");
    ticketNameCell.textContent = ticket.content.ticket_name.ticket_name;
    eachRow.appendChild(ticketNameCell);

    const ticketDetailsCell = document.createElement("td");
    ticketDetailsCell.textContent =
    ticket.content.ticket_details.ticket_details;
    eachRow.appendChild(ticketDetailsCell);

    const actionsCell = document.createElement("td");
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.classList.add("edit-button");
    editButton.addEventListener("click", () => editTicket(index, data));

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("tick-delete-button");
    deleteButton.addEventListener("click", () => deleteTicket(ticket.id));

    actionsCell.appendChild(editButton);
    actionsCell.appendChild(deleteButton);
    eachRow.appendChild(actionsCell);

    ticketbody.appendChild(eachRow);
  });

  ticketTable.appendChild(ticketbody);
  ticketTableContainer.appendChild(ticketTable);
}

// Edit ticket
function editTicket(index, data) {
  const ticket = data[index];

  hideAllForms();
  ticketForm.style.display = "block";

  document.getElementById("teamSelect").value = ticket.content.teams.team_name;
  document.getElementById("ticketName").value =ticket.content.ticket_name.ticket_name;
  document.getElementById("ticketDetails").value =ticket.content.ticket_details.ticket_details;

  // Handle form submission
  submitForm = () => {
    const updatedTicket = {
      content: {
        teams: {
          team_name: document.getElementById("teamSelect").value,
        },
        ticket_name: {
          ticket_name: document.getElementById("ticketName").value,
        },
        ticket_details: {
          ticket_details: document.getElementById("ticketDetails").value,
        },
      },
    };

    updateTicket(ticket.id, updatedTicket);
    fetchTicketData();
  };
}

// Update Ticket
function updateTicket(ticketId, updatedTicket) {
  domo
    .put(
      `/domo/datastores/v1/collections/ticket_tool/documents/${ticketId}`,
      updatedTicket
    )
    .then(() => {
      console.log("Ticket updated successfully");
      // errorMessage.textContent = "Ticket updated successfully";
      // errorMessage.style.color = "#bbac0e";
      displayMessage("Ticket updated successfully");
    })
    .catch((error) => {
      console.log("Error updating ticket", error);
      alert("Error updating ticket");
    });
}

// Delete Ticket
function deleteTicket(ticketId) {
    domo
    .delete(`/domo/datastores/v1/collections/ticket_tool/documents/${ticketId}`)
    .then(() => {
      console.log("Ticket deleted successfully");
      // manageTicketMessage.textContent = "Ticket deleted successfully";
      // manageTicketMessage.style.color = "#bbac0e";
      manageTicketDisplayMessage("Ticket deleted successfully");
      fetchTicketData(); // Refresh ticket data
    })
    .catch((error) => {
      console.log("Error deleting ticket", error);
      alert("Error deleting ticket");
    });
}

// display messages
function displayMessage(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add("message");
  errorMessage.style.display = "block";
  setTimeout(() => {
    errorMessage.style.display = "none";
  }, 4000);
}

function teamDisplayMessage(message) {
  teamMessage.textContent = message;
  teamMessage.classList.add("team-message");
  teamMessage.style.display = "block";
  setTimeout(() => {
    teamMessage.style.display = "none";
  }, 4000);
}

function manageTeamDisplayMessage(message){
  manageTeamMessage.textContent = message;
  manageTeamMessage.classList.add("manageTeamMessage");
  manageTeamMessage.style.display = "block";
  setTimeout(() => {
    manageTeamMessage.style.display = "none";
  }, 4000);
}

function manageTicketDisplayMessage(message) {
  manageTicketMessage.textContent = message;
  manageTicketMessage.classList.add("manageTicketMessage");
  manageTicketMessage.style.display = "block";
  setTimeout(() => {
    manageTicketMessage.style.display = "none";
  }, 4000);
}