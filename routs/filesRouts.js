#!/usr/bin/env node

'use strict'

/* MODULE IMPORTS */
const Router = require('koa-router')

/* IMPORT CUSTOM MODULES */
const Download = require('../modules/files')

const router = new Router()
const dbName = 'website.db'

/**
 * The user download list page.
 *
 * @name MyDownloads Page
 * @route {GET} /myDownloads
 */
router.get('/myDownloads/', async ctx => await ctx.render('myDownloads'))

/**
 * The website's home/upload page .
 *
 * @name Home Page
 * @route {GET} /
 */
router.get('/', async ctx => {
	await ctx.render('homepage', {user: ctx.session.user})
})

/**
 * The single download page.
 *
 * @name FileDownload Page
 * @route {GET} /downloadFile
 */
router.get('/downloadFile/:downloadId', async ctx => {
	const fileSender = await new Download(dbName)

	await fileSender.addDummy()
	const download = await fileSender.download(ctx.params.downloadId)
	const downloadName = await fileSender.getName(ctx.params.downloadId)
	await ctx.render('downloadFile', {filePath: download.filePath, fileName: downloadName.fileName})
})

module.exports = router
