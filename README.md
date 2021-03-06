`denmark-cvr-neo4j` - WIP
=========================

> Graph representation of http://datacvr.virk.dk/ in Neo4j

This is a project inspired by the work done in the [relat.io](https://businesshack2015.wordpress.com/2015/10/12/gruppe-8/) group during
[Business Hack 2015](https://data.virk.dk/events/business-hack-2015).

The case was initially pitched by Jyske Bank who wanted to make qualified
estimates of growth potential in companies, based on the people-networks behind
the given company.

This project attempts to model CVR data as a graph, permitting queries such as:

* Which other companies is a given company connected to through the executive team,
  board members and investors?
* Which other companies are in my sector?
* How has ownership changed in the past?

Usage
-----

This project depends on Node.js and Neo4j. First you need to replicate the CVR
Elastic server. This done by running:

```sh
node bin/replicate cvr-replica
```

This will create a [LevelDB](http://leveldb.org/) in `cvr-replica`.
LevelDB will compress the contents using the snappy compression algorithm.
On my machine a full replica, as of 2015-10-25, is 8.3GB while compressed in LevelDB.

To run the Neo4j server, I have included an optional Dockerfile which allows you
to run the database in a Docker container.

To start the neo4j docker image run:

```sh
docker build -t denmark-cvr-neo4j .
docker run \
    --detach \
    --publish=7474:7474 \
    --volume=`pwd`/neo4j-data:/data \
    denmark-cvr-neo4j
```

LICENSE
-------

[ISC](LICENSE)

Be aware that collecting the data puts a lot of pressure on Virk.dk's
Elastic Search database.

If you use this project for anything useful, don't hesitate to get in touch,
I'd love to hear what you've come up with.
