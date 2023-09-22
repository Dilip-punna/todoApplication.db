const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");

let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at 3000");
    });
  } catch (e) {
    console.error(`DB server Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const checkRequestQuery = async (request, response, next) => {
  const { search_q, category, priority, status, date } = request.query;
  const { todoId } = request.params;
  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const categoryIsInArray = categoryArray.includes(category);
    if (categoryIsInArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }
  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }
  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const statusIsInArray = statusArray.includes(status);
    if (statusIsInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }
  if (date !== undefined) {
    try {
      const myDate = new Date(date);
      const formattedDate = format(myDate, "yyyy-MM-dd"); // Removed redundant date conversion
      console.log(formattedDate, "f");
      const result = toDate(myDate);
      console.log(result, "r");
      console.log(new Date(), "new");
      const isValidDate = await isValid(result);
      console.log(isValidDate, "V");
      if (isValidDate === true) {
        request.date = formattedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  request.todoId = todoId;
  request.search_q = search_q;
  next();
};

// ... (previous code)

const checkRequestBody = async (request, response, next) => {
  const { id, todo, category, priority, status, dueDate } = request.body;
  const { todoId } = request.params;
  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const categoryIsInArray = categoryArray.includes(category);
    if (categoryIsInArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }
  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }
  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const statusIsInArray = statusArray.includes(status);
    if (statusIsInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }
  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate);
      const formattedDate = format(myDate, "yyyy-MM-dd");
      console.log(formattedDate, "f");
      const result = toDate(myDate);
      console.log(result, "r");
      console.log(new Date(), "new");
      const isValidDate = await isValid(result);
      console.log(isValidDate, "V");
      if (isValidDate === true) {
        request.date = formattedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  request.todoId = todo;
  request.id = todoId;
  next();
};

app.get("/todos/", checkRequestQuery, async (request, response) => {
  const { status = "", search_q = "", priority = "", category = "" } = request;
  console.log(status, search_q, priority, category);
  const getTodosQuery = `
    SELECT 
      id,
      todo,
      priority,
      status, 
      category,
      due_date AS dueDate
    FROM todo
    WHERE 
      todo LIKE '${search_q}%' AND priority LIKE '${priority}%'
      AND status LIKE '${status}%' AND category LIKE '${category}%';`;
  const todosArray = await database.all(getTodosQuery);
  response.send(todosArray);
});

app.get("/agenda/", async (req, res) => {
  try {
    const dueDate = req.query.date;
    if (isValid(toDate(dueDate, "yyyy-MM-dd", new Date()))) {
      const query = "SELECT * FROM todo WHERE due_date = ?";
      const todos = await database.all(query, [dueDate]);
      res.json(todos);
    } else {
      res.status(400);
      res.send("Invalid Due Date");
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/todos/:todoId", checkRequestQuery, async (request, response) => {
  const { todoId } = request.params;
  console.log(
    request.status,
    request.search_q,
    request.priority,
    request.category
  );
  const getTodosQuery = `
    SELECT 
      id,
      todo,
      priority,
      status, 
      category,
      due_date AS dueDate
    FROM todo
    WHERE 
      id = ${todoId}`;
  const todosArray = await database.get(getTodosQuery);
  response.send(todosArray);
});

app.post("/todos/", checkRequestBody, async (request, response) => {
  const { id, todo, category, priority, status, dueDate } = request;
  const addTodosQuery = `
    INSERT INTO
     todo(id, todo, priority, status, category, due_date)
    VALUES
      (
          ${id},
          '${todo}',
          '${priority}',
          '${status}',
          '${category}',
          '${dueDate}'
      ); `;

  const createUser = await database.run(addTodosQuery);
  console.log(createUser);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId", checkRequestBody, async (request, response) => {
  const { todoId } = request.params;
  const { priority, todo, status, category, dueDate } = request.body;
  let updateQuery = null;
  console.log(priority, todo, status, dueDate, category);
  switch (true) {
    case status !== undefined:
      updateQuery = `
          UPDATE todo
          SET status = '${status}'
          WHERE id=${todoId};`;
      await database.run(updateQuery);
      response.send("Status Updated");
      break;
    case priority !== undefined:
      updateQuery = `
        UPDATE todo
        SET priority = '${priority}'
        WHERE id=${todoId};`;
      await database.run(updateQuery);
      response.send("Priority Updated");
      break;
    case todo !== undefined:
      updateQuery = `
        UPDATE todo
        SET todo = '${todo}' 
        WHERE id = ${todoId};`;
      await database.run(updateQuery);
      response.send("Todo Updated");
      break;
    case category !== undefined:
      updateQuery = `
        UPDATE todo
        SET category = '${category}' 
        WHERE id = ${todoId};`;
      await database.run(updateQuery);
      response.send("Category Updated");
      break;
    case dueDate !== undefined:
      updateQuery = `
        UPDATE todo
        SET due_date = '${dueDate}' 
        WHERE id = ${todoId};`;
      await database.run(updateQuery);
      response.send("Due Date Updated");
      break;
    default:
      response.status(400);
      response.send("Invalid Update Request");
  }
});

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM todo
  WHERE id = ${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
