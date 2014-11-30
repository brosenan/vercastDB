VercastDB: A Version-Controlled NoSQL Database
==============================================

VercastDB is a NoSQL database.  It is a key/value store with incremental map/reduce capabilities.
But this is not a reason why you should be interested in it.  
What makes VercastDB interesting is the fact that everything stored on it is under version control.
This means when you make a change to the data, all the previous versions are kept.  But not only that.
It also means that one can fork the entire state of the database to form a new branch,
and then merge two such branches.

This means it can be used for storing things that like source code, can be collaborated by different people,
allowing people to work in isolation, but still allowing them to synchronize their work.
In particular, VercastDB can be used as a version control system for your source code.
But version control can give us much more than that.

Even if you are not interested in version control as a DB feature, 
you can still benefit from it, in a somewhat surprising manner.
The ability to efficiently fork and merge the entire database provides this NoSQL database
two things relational databases supported out of the box, but were lost in the NoSQL world in favor of
availability and scalability.  These things are transactions and joins.

Transactions
------------

A transaction is a collection of database operations bundled together.  If the transaction is successful, all operations take effect.
If it is not, none of the operations take effect.  In no point should a partial effect be visible anywhere but inside the transaction.
NoSQL databases largely abandoned transactions.  Some support atomic operations on subsets of the data (e.g.,
inside one row in BigTable, or in a single document in MongoDB), 
but these are very limited forms of transactions that dictate how the data should be organized.
Supporting full ACID transactions means serialization of all modifications, which hinders scalability.
Version control allows a transaction model suitable for the NoSQL world.  To start a transaction you fork a new branch.
Everything you do on that branch is isolated from the rest of the world.
Then, when you wish to commit your work, you simply push (or merge) your changes to the branch you forked from.
Now, if no conflicts occured, all the modifications you made on the side branch appear in the original branch
in a single, atomic operation.  If at the time you were working in your transaction branch someone committed a conflicting
change to the branch you forked from, your transaction will be rejected, and you will need to run it again, just like in a relational database.

Working on a single "main" branch provides ACID transactions, but just like in relational databases,
congestion on that branch will only scale that much.
To deal with this problem, we can use any number of branches, and organize them in some hierarchy, with a single "main" branch.
This way, we can commit transactions to any branch, and these changes will propagate through this hierarchy, with conflicts
being resolved on a first-come-first-serve basis.  A transaction that reaches the top can be considered as "safe" -- it will not be rejected.
This model scales much better, and the only drawback it has, with regard to ACID transactions is durability:
When we commit a transaction, we do not know right away if it will be accepted or rejected.

Joins
-----

A join in a relational database is a way we retrieve information from two related tables, using a mutual connection.  
For example, if we have one table containing peoples' tweets, and another table who follows whom, a join can be used to find out
which tweets are of interest for a certain user.
NoSQL databases typically do not offer joins.  
Instead, they allow the data to be structured in a way that will avoid most of the need for joins.
Most.  Not all.
In cases like the above example, NoSQL experts will tell you you need to de-normalize your data.
That is, to prepare a ready-made table of the tweets each user is interested in, and then whenever a user tweets something,
or whenever a user starts following another user, this table needs to be updated with the new tweets.
Doing so is both cumbersome and error prone.

VercastDB implements incremental map/reduce.
The map-part allows users to define functions that transform key/value pairs into change.
A change can be, among other things, the addition of an element to the database, or even assigning a map function to a range of keys.
With such a mechanism we can define de-normalization rules declaratively.
In particular, we can define joins the way they were intended by the gods of NoSQL.