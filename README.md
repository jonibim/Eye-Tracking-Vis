# Eye-Tracking-Vis
This repository will be used to build the eye tracking visualization project as described by the DBL abstract. This **README** will represent some important aspects of the project.

## Introduction 

In this project, we are required to build a multi-visualization web-based tool suited for eye tracking movement data uploaded by the user. 

## Objectives

We will represent the objectives needed to be fulfilled for the project. 

- [ ] The visualization tool should show at least four different visual techniques on different aspects (time, space, tasks, subjects etc.)
- [ ] The visualization tool should include brushing and linking data. As an example, if the user is moving the timeline or selecting a group in one view, the other corresponding views included in the tool must also be synced to these changes. This is called a **multi coordinated view**
- [ ] At least one out of  [7 categories of interactions](#7-categories-of-interactions) should be implemented in the project.
- [ ] The visualization tool should be a web-based tool 

Now we present some features that the final product must satisfy. Note that not all the features must be completed in order to consider the project as finished. The principle is that the more features are included with the final product, the better the end results are guaranteed to be (probably even winning prices). In the final program the user must be able to:

- [ ] identify an anomaly on the data easily
- [ ] identify group and clusters
- [ ] identify patterns 
- [ ] select groups, clusters or outliers
- [ ] change color coding 
- [ ] filter various factors (such as people, space and time)
- [ ] see labels of objects by hovering the mouse on the object (aka tooltips)
- [ ]  screenshot a certain kind of view with the addition that all parameters of the view/visualization are attached to the screenshot such that it can be rebuilt later (aka screenshot + snapshot)

## The dataset

We are given a dataset for which I will describe in a moment, but our tool should be also able to visualize data of the same format of the given data. 

### Terminology

* The recorded data comes in form of a **scanpath**
* A scanpath consists of a **sequence of 2D coordinates**
  * The 2D cooridnates are known as **fixations**
  * A scanpath also contains the **fixations durations**
  * The duration of a fixation is represented by the **radius**
* **Gaze** points are spatially and temporally connected groups into fixations
* An **Area of Interest (AOIs)** is a region of specific interest on the stimulus
* The eye movement between two fixations is called a **sacade**
* A sacade from one AOI to the next is called a **transition**
* A **complete sequence** of fixations and saccades is a **scanpath**
* Regions in a stimulus which are visually attended more than other are called **hotspots**

### Contents

* 3 data dimension:
  * **space** - region on which the visual attention is paid i.e maps
  * **time** - the progress of the study
  * **study participants** - referred as test subjects
* 2 supporting information:
  * **stimulus information + semantics** - scene that subjects inspects
  * **task to be solved** - responsible for the pattern in visual research

### Properties

The data dimensions space comes from visual stimulus. Time dimensions comes from fixation duration. The durations is represented in *milliseconds*. A scanpath is generated by each subject. The scanpaths have different lengths and complexity (usually depending on the task given). Certain regions might have special meaning (**semantics**). An AOI can also be defined as a spatial aggregation, that helps to reduce the amount of scanpath data, **but** also resulting in loss of information

### Format

The dataset is a CSV-like text file of all the recorded paths with the following attributes:

- **Timestamp** - point in a time at which the fixation was done
- **StimuliName** - describes the stimulus name (corresponding to the .jpg and .zip)*
- **FixationIndex** - counter (not relevant for the project)
- **FixationDuration** -  how long someone fixated on a certain coordinate
- **MappedFixationX** - the x-coordinate of the fixation
- **MappedFixationY** - the y-coordinate of the fixation
- **user** - describes subject number
- **description** - type of stimulus (i.e color or grey)



### Dealing with runtime complexities problems

The given data or the uploaded data can be of a massive size. Therefore, if the algorithms implemented on the end product have not taken this into account, they might work for an undesirable long waiting time, or they might even break. Some possible solutions to this kind of problem are:

* Find, generate or build advanced algorithms
* Reduce the amount of data in the given dataset by cutting off a part of the data*
* Aggregate eye movements data into AOIs and aggregate the corresponding scanpaths
  * However, for this method we encounter loss of information and confusion on choosing the fixations to group them into one AOIs

## Types of visualizations

Visualizing eye tracking movements data can be done in different ways. Here are some suggested methods of visualizing this type of data. Note that the data can be also visualized in other ways.  

### 1. Visual Attention Maps

* Aggregates over time and subjects

### 2. Gaze Plots

* Shows temporal usual attention over time
* Merging and splitting behavior shows transition between AOIs
* River thickness shows #people paying attention to AOIs

### 3. Transition Graphs

* Aggregates visual attention and AOI are used to build transition matrices 
* Matrices are encoded into a node-link diagram reflecting the relations of AOIs
* The order of AOIs in all scanpaths can be used to an hierarchical graph layout

### 4. Eye Clouds

* Aggregates over space, time and subjects
* shows small stimulus regions that have been usually attended frequently as thumbnail images

### 5. Custom visualization 

* and more...



## Additional Information 

These are informations not included in the abstract, which require some reading of external informations. The external sources are included in the given abstract. This section is going to include a very short summary such that the reader can be familiarized with the terms used in this **README**.

### 7 categories of interactions

1. **SELECT**
2. **EXPLORE**
3. **RECONFIGURE**
4. **ENCODE**
5. **ABSTRACT, ELABORATE**
6. **FILTER**
7. **CONNECT**

# Developing

## Starting the webserver

First make sure you have **Node.js** installed

```bash
git clone https://github.com/t0xicdream/Eye-Tracking-Vis
cd Eye-Tracking-Vis
npm install #Install Dependecies 
DEBUG=myapp:* npm start #MacOS or Linux
set DEBUG=myapp:* & npm start #Windows
```
## Useful Resources

* https://www.sitepoint.com/a-beginners-guide-to-pug/
* https://devhints.io/pug
* https://pugjs.org/api/getting-started.html
* https://auth0.com/blog/create-a-simple-and-stylish-node-express-app/
* https://closebrace.com/tutorials/2017-03-02/creating-a-simple-restful-web-app-with-nodejs-express-and-mongodb
* https://www.c-sharpcorner.com/article/building-web-application-using-node-js/
* https://code.tutsplus.com/tutorials/build-web-application-using-nodejs--cms-29652







